const { ethers } = require("hardhat");

async function main() {
  const DISPUTE_ADDRESS = "0xbA0294c11254A1A42981D6331a04EcCfeF842264";
  const ESCROW_ADDRESS = "0x1E8A39dEBAE80d565936cE4a8A60E932F409CbEd";

  const verifiers = [
    "0xDA53c57483A51399f714C674C675f8d661fE9cA6",
    "0xBa47e73C0Dcc0f2b791d03BfFB7b5fC5385c6fFE",
    "0xc5FbE6eb292bDb29A0449cc5C7DF049d8eaAaa68",
  ];

  const dispute = await ethers.getContractAt("Dispute", DISPUTE_ADDRESS);

  console.log("Raising dispute for milestone 1...");
  const tx = await dispute.raiseDispute(ESCROW_ADDRESS, 1, verifiers);
  const receipt = await tx.wait();
  console.log("Dispute raised. Tx hash:", receipt.hash);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
