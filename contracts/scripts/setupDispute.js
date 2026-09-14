const { ethers } = require("hardhat");

async function main() {
  const ESCROW_ADDRESS = "0x1E8A39dEBAE80d565936cE4a8A60E932F409CbEd";
  const DISPUTE_ADDRESS = "0xbA0294c11254A1A42981D6331a04EcCfeF842264";

  const escrow = await ethers.getContractAt("Escrow", ESCROW_ADDRESS);

  console.log("Linking dispute contract to escrow...");
  const tx = await escrow.setDisputeContract(DISPUTE_ADDRESS);
  await tx.wait();
  console.log("Linked successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
