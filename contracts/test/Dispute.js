const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Dispute", function () {
  async function setupEscrowWithDispute() {
    const [deployer, client, freelancer, verifier1, verifier2, verifier3] =
      await ethers.getSigners();

    const milestoneAmounts = [ethers.parseEther("1"), ethers.parseEther("1")];

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(
      client.address,
      freelancer.address,
      deployer.address, // oracle
      1,
      ethers.encodeBytes32String("dummyhash"),
      milestoneAmounts,
      { value: ethers.parseEther("2") },
    );

    const Dispute = await ethers.getContractFactory("Dispute");
    const dispute = await Dispute.deploy(deployer.address); // oracle

    // Oracle links the two contracts together
    await escrow
      .connect(deployer)
      .setDisputeContract(await dispute.getAddress());

    // Freelancer submits milestone 0, client refuses to approve -- this is why we're disputing
    await escrow.connect(freelancer).submitMilestone(0);

    return {
      escrow,
      dispute,
      deployer,
      client,
      freelancer,
      verifier1,
      verifier2,
      verifier3,
    };
  }

  it("should resolve in favor of the freelancer with 2 votes", async function () {
    const {
      escrow,
      dispute,
      deployer,
      freelancer,
      verifier1,
      verifier2,
      verifier3,
    } = await setupEscrowWithDispute();

    const tx = await dispute.connect(deployer).raiseDispute(
      await escrow.getAddress(),
      0, // milestoneIndex
      [verifier1.address, verifier2.address, verifier3.address],
    );
    await tx.wait();

    const balanceBefore = await ethers.provider.getBalance(freelancer.address);

    await dispute.connect(verifier1).castVote(0, true); // vote for freelancer
    await dispute.connect(verifier2).castVote(0, true); // 2nd vote -- should trigger resolution

    const balanceAfter = await ethers.provider.getBalance(freelancer.address);

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1"));

    const [, , freelancerVotes, clientVotes, resolved] = await dispute.disputes(
      0,
    );
    expect(resolved).to.equal(true);
  });

  it("should resolve in favor of the client with 2 votes", async function () {
    const {
      escrow,
      dispute,
      deployer,
      client,
      verifier1,
      verifier2,
      verifier3,
    } = await setupEscrowWithDispute();

    await dispute
      .connect(deployer)
      .raiseDispute(await escrow.getAddress(), 0, [
        verifier1.address,
        verifier2.address,
        verifier3.address,
      ]);

    const balanceBefore = await ethers.provider.getBalance(client.address);

    await dispute.connect(verifier1).castVote(0, false); // vote for client
    await dispute.connect(verifier2).castVote(0, false); // 2nd vote -- should trigger resolution

    const balanceAfter = await ethers.provider.getBalance(client.address);

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1"));
  });

  it("should reject a vote from someone who isn't a verifier", async function () {
    const { escrow, dispute, deployer, verifier1, verifier2, verifier3 } =
      await setupEscrowWithDispute();
    const signers = await ethers.getSigners();
    const randomPerson = signers[6]; // definitely not one of the verifiers

    await dispute
      .connect(deployer)
      .raiseDispute(await escrow.getAddress(), 0, [
        verifier1.address,
        verifier2.address,
        verifier3.address,
      ]);

    await expect(
      dispute.connect(randomPerson).castVote(0, true),
    ).to.be.revertedWith("Not a verifier for this dispute");
  });
  it("should reject a verifier voting twice", async function () {
    const { escrow, dispute, deployer, verifier1, verifier2, verifier3 } =
      await setupEscrowWithDispute();

    await dispute
      .connect(deployer)
      .raiseDispute(await escrow.getAddress(), 0, [
        verifier1.address,
        verifier2.address,
        verifier3.address,
      ]);

    await dispute.connect(verifier1).castVote(0, true);

    await expect(
      dispute.connect(verifier1).castVote(0, false),
    ).to.be.revertedWith("Already voted");
  });

  it("should reject raising a dispute with duplicate verifiers", async function () {
    const { escrow, dispute, deployer, verifier1, verifier2 } =
      await setupEscrowWithDispute();

    await expect(
      dispute.connect(deployer).raiseDispute(
        await escrow.getAddress(),
        0,
        [verifier1.address, verifier1.address, verifier2.address], // verifier1 listed twice
      ),
    ).to.be.revertedWith("Verifiers must be 3 distinct addresses");
  });
});
