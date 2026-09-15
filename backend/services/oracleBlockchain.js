const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const {
  DISPUTE_CONTRACT_ADDRESS,
  VERIFIERS,
} = require("../config/blockchainConfig");

const disputeArtifactPath = path.join(
  __dirname,
  "../../contracts/artifacts/contracts/Dispute.sol/Dispute.json",
);
const disputeArtifact = JSON.parse(
  fs.readFileSync(disputeArtifactPath, "utf8"),
);

function getOracleWallet() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  return new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);
}

/**
 * Raises a dispute on-chain, signed by the backend's own oracle wallet.
 * Returns the numeric disputeId assigned by the contract.
 */
async function raiseDisputeOnChain(escrowAddress, milestoneIndex) {
  const wallet = getOracleWallet();
  const dispute = new ethers.Contract(
    DISPUTE_CONTRACT_ADDRESS,
    disputeArtifact.abi,
    wallet,
  );

  const tx = await dispute.raiseDispute(
    escrowAddress,
    milestoneIndex,
    VERIFIERS,
  );
  const receipt = await tx.wait();

  // Find the DisputeRaised event in the transaction's logs to get the real disputeId
  const event = receipt.logs
    .map((log) => {
      try {
        return dispute.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed && parsed.name === "DisputeRaised");

  const disputeId = Number(event.args.disputeId);
  return { disputeId, txHash: receipt.hash };
}

module.exports = { raiseDisputeOnChain };
