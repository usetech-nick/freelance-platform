const ESCROW_ABI = [
  "function submitMilestone(uint256 milestoneIndex) public",
  "function approveMilestone(uint256 milestoneIndex) public",
  "function refund() public",
  "function getMilestoneCount() public view returns (uint256)",
  "function milestones(uint256) public view returns (uint256 amount, uint8 status)",
];

export async function getEscrowContract(address, signer) {
  const { ethers } = await import("ethers");
  return new ethers.Contract(address, ESCROW_ABI, signer);
}

export async function submitMilestone(address, signer, index) {
  const contract = await getEscrowContract(address, signer);
  const tx = await contract.submitMilestone(index);
  await tx.wait();
}

export async function approveMilestone(address, signer, index) {
  const contract = await getEscrowContract(address, signer);
  const tx = await contract.approveMilestone(index);
  await tx.wait();
}

export async function refundProject(address, signer) {
  const contract = await getEscrowContract(address, signer);
  const tx = await contract.refund();
  await tx.wait();
}

export async function getMilestones(address, signer) {
  const contract = await getEscrowContract(address, signer);
  const count = await contract.getMilestoneCount();
  const milestones = [];
  for (let i = 0; i < count; i++) {
    const [amount, status] = await contract.milestones(i);
    milestones.push({
      index: i,
      amount: amount.toString(),
      status: Number(status),
    });
  }
  return milestones;
}
