const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", function () {
  it("should deploy and hold the correct deposit", async function () {
    // Hardhat gives us fake test accounts with fake ETH, pre-funded, for free
    const [deployer, client, freelancer] = await ethers.getSigners();

    const milestoneAmounts = [
      ethers.parseEther("1"),
      ethers.parseEther("1"),
      ethers.parseEther("1"),
    ]; // 3 milestones, 1 ETH each = 3 ETH total

    const totalDeposit = ethers.parseEther("3");

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(
      client.address,
      freelancer.address,
      1, // riskCategory: Medium
      ethers.encodeBytes32String("dummyhash"),
      milestoneAmounts,
      { value: totalDeposit },
    );

    expect(await escrow.client()).to.equal(client.address);
    expect(await escrow.freelancer()).to.equal(freelancer.address);
    expect(await escrow.getMilestoneCount()).to.equal(3);

    const contractBalance = await ethers.provider.getBalance(
      await escrow.getAddress(),
    );
    expect(contractBalance).to.equal(totalDeposit);
  });

  it("should reject deployment if deposit doesn't match milestone total", async function () {
    const [deployer, client, freelancer] = await ethers.getSigners();

    const milestoneAmounts = [ethers.parseEther("1"), ethers.parseEther("1")];
    const wrongDeposit = ethers.parseEther("1"); // should be 2, sending 1 on purpose

    const Escrow = await ethers.getContractFactory("Escrow");

    await expect(
      Escrow.deploy(
        client.address,
        freelancer.address,
        1,
        ethers.encodeBytes32String("dummyhash"),
        milestoneAmounts,
        { value: wrongDeposit },
      ),
    ).to.be.revertedWith("Deposit must equal sum of milestone amounts");
  });

  it("should complete the full submit -> approve -> payment flow", async function () {
    const [deployer, client, freelancer] = await ethers.getSigners();

    const milestoneAmounts = [ethers.parseEther("1"), ethers.parseEther("2")];
    const totalDeposit = ethers.parseEther("3");

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(
      client.address,
      freelancer.address,
      1,
      ethers.encodeBytes32String("dummyhash"),
      milestoneAmounts,
      { value: totalDeposit },
    );

    // Freelancer submits milestone 0
    await escrow.connect(freelancer).submitMilestone(0);

    // Track freelancer's balance before approval, to check they actually got paid
    const balanceBefore = await ethers.provider.getBalance(freelancer.address);

    // Client approves it -> should trigger payment
    await escrow.connect(client).approveMilestone(0);

    const balanceAfter = await ethers.provider.getBalance(freelancer.address);

    // Freelancer should have gained exactly 1 ETH (milestone 0's amount)
    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1"));
  });

  it("should reject a freelancer trying to approve their own milestone", async function () {
    const [deployer, client, freelancer] = await ethers.getSigners();

    const milestoneAmounts = [ethers.parseEther("1")];
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(
      client.address,
      freelancer.address,
      1,
      ethers.encodeBytes32String("dummyhash"),
      milestoneAmounts,
      { value: ethers.parseEther("1") },
    );

    await escrow.connect(freelancer).submitMilestone(0);

    // Freelancer tries to approve their OWN milestone -- should fail
    await expect(
      escrow.connect(freelancer).approveMilestone(0),
    ).to.be.revertedWith("Only the client can call this");
  });

  it("should reject approving a milestone that was never submitted", async function () {
    const [deployer, client, freelancer] = await ethers.getSigners();

    const milestoneAmounts = [ethers.parseEther("1")];
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(
      client.address,
      freelancer.address,
      1,
      ethers.encodeBytes32String("dummyhash"),
      milestoneAmounts,
      { value: ethers.parseEther("1") },
    );

    // Client tries to approve without freelancer ever submitting -- should fail
    await expect(escrow.connect(client).approveMilestone(0)).to.be.revertedWith(
      "Milestone not in Submitted state",
    );
  });
});
