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
      deployer.address,
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
        deployer.address,
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
      deployer.address,
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
      deployer.address,
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
      deployer.address,
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
  it("should refund only the unpaid milestones", async function () {
    const [deployer, client, freelancer] = await ethers.getSigners();

    const milestoneAmounts = [
      ethers.parseEther("1"),
      ethers.parseEther("1"),
      ethers.parseEther("1"),
    ];

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(
      client.address,
      freelancer.address,
      deployer.address,
      1,
      ethers.encodeBytes32String("dummyhash"),
      milestoneAmounts,
      { value: ethers.parseEther("3") },
    );

    // Milestone 0 gets fully paid out
    await escrow.connect(freelancer).submitMilestone(0);
    await escrow.connect(client).approveMilestone(0);

    const balanceBefore = await ethers.provider.getBalance(client.address);

    // Refund the rest (milestones 1 and 2 = 2 ETH total)
    const tx = await escrow.connect(client).refund();
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;

    const balanceAfter = await ethers.provider.getBalance(client.address);

    // Client should net +2 ETH minus whatever gas they spent calling refund()
    expect(balanceAfter - balanceBefore + gasCost).to.equal(
      ethers.parseEther("2"),
    );
  });

  it("should reject refund if there's nothing left to refund", async function () {
    const [deployer, client, freelancer] = await ethers.getSigners();

    const milestoneAmounts = [ethers.parseEther("1")];
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(
      client.address,
      freelancer.address,
      deployer.address,
      1,
      ethers.encodeBytes32String("dummyhash"),
      milestoneAmounts,
      { value: ethers.parseEther("1") },
    );

    await escrow.connect(freelancer).submitMilestone(0);
    await escrow.connect(client).approveMilestone(0);

    // Everything's already paid -- refund should have nothing to give back
    await expect(escrow.connect(client).refund()).to.be.revertedWith(
      "Nothing left to refund",
    );
  });
  it("should reject risk category update from anyone except the oracle", async function () {
    const [deployer, client, freelancer] = await ethers.getSigners();

    const milestoneAmounts = [ethers.parseEther("1")];
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(
      client.address,
      freelancer.address,
      deployer.address, // oracle
      1,
      ethers.encodeBytes32String("dummyhash"),
      milestoneAmounts,
      { value: ethers.parseEther("1") },
    );

    // Client tries to update risk -- should fail, they're not the oracle
    await expect(
      escrow.connect(client).updateRiskCategory(2),
    ).to.be.revertedWith("Only the backend oracle can call this");

    // The actual oracle (deployer) should succeed
    await escrow.connect(deployer).updateRiskCategory(2);
    expect(await escrow.riskCategory()).to.equal(2);
  });
});
