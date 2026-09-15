const ESCROW_ABI = [
  "function submitMilestone(uint256 milestoneIndex) public",
  "function approveMilestone(uint256 milestoneIndex) public",
  "function refund() public",
  "function getMilestoneCount() public view returns (uint256)",
  "function milestones(uint256) public view returns (uint256 amount, uint8 status)",
  "function updateRequirementHash(bytes32 newHash) public",
];

const DISPUTE_ABI = [
  "function castVote(uint256 disputeId, bool voteForFreelancer) public",
  "function disputes(uint256) public view returns (address escrowAddress, uint256 milestoneIndex, uint256 freelancerVotes, uint256 clientVotes, bool resolved)",
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

export async function deployEscrow(params, signer) {
  const { ethers } = await import("ethers");
  const factory = new ethers.ContractFactory(
    params.abi,
    params.bytecode,
    signer,
  );
  const contract = await factory.deploy(...params.constructorArgs, {
    value: params.totalValueWei,
  });
  await contract.waitForDeployment();
  return await contract.getAddress();
}

export async function updateRequirementHashOnChain(address, signer, newHash) {
  const contract = await getEscrowContract(address, signer);
  const tx = await contract.updateRequirementHash(newHash);
  await tx.wait();
}

export async function getDisputeStatus(
  disputeContractAddress,
  disputeId,
  signer,
) {
  const { ethers } = await import("ethers");
  const contract = new ethers.Contract(
    disputeContractAddress,
    DISPUTE_ABI,
    signer,
  );
  const [, , freelancerVotes, clientVotes, resolved] =
    await contract.disputes(disputeId);
  return {
    freelancerVotes: Number(freelancerVotes),
    clientVotes: Number(clientVotes),
    resolved,
  };
}

export async function castDisputeVote(
  disputeContractAddress,
  disputeId,
  signer,
  voteForFreelancer,
) {
  const { ethers } = await import("ethers");
  const contract = new ethers.Contract(
    disputeContractAddress,
    DISPUTE_ABI,
    signer,
  );
  const tx = await contract.castVote(disputeId, voteForFreelancer);
  await tx.wait();
}
