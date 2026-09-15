import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import {
  submitMilestone,
  approveMilestone,
  refundProject,
  getMilestones,
  deployEscrow,
  updateRequirementHashOnChain,
  getDisputeStatus,
  castDisputeVote,
} from "../escrow.js";

const BACKEND_URL = "http://localhost:3000";
const STATUS_LABELS = ["Pending", "Submitted", "Approved"];
const DISPUTE_CONTRACT_ADDRESS = "0xbA0294c11254A1A42981D6331a04EcCfeF842264";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, signer, walletAddress, connectWallet } = useAuth();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [applications, setApplications] = useState([]);
  const [newRequirements, setNewRequirements] = useState("");
  const [disputeStatus, setDisputeStatus] = useState(null);

  async function loadProject() {
    const res = await fetch(`${BACKEND_URL}/projects/${id}`);
    const data = await res.json();
    setProject(data);
    setLoading(false);

    if (data.escrowContractAddress && signer) {
      const ms = await getMilestones(data.escrowContractAddress, signer);
      setMilestones(ms);
    }

    if (!data.freelancer) {
      const appsRes = await fetch(`${BACKEND_URL}/projects/${id}/applications`);
      setApplications(await appsRes.json());
    }

    if (data.activeDispute?.disputeId !== undefined && signer) {
      const status = await getDisputeStatus(
        DISPUTE_CONTRACT_ADDRESS,
        data.activeDispute.disputeId,
        signer,
      );
      setDisputeStatus(status);
    }
  }

  useEffect(() => {
    loadProject();
  }, [id, signer]);

  async function handleSubmit(index) {
    setActionError(null);
    setActionStatus(`Submitting milestone ${index}... confirm in MetaMask`);
    try {
      await submitMilestone(project.escrowContractAddress, signer, index);
      setActionStatus("Submitted successfully.");
      await loadProject();
    } catch (err) {
      setActionError(err.message);
      setActionStatus(null);
    }
  }

  async function handleApprove(index) {
    setActionError(null);
    setActionStatus(`Approving milestone ${index}... confirm in MetaMask`);
    try {
      await approveMilestone(project.escrowContractAddress, signer, index);
      setActionStatus("Approved and paid successfully.");
      await loadProject();
    } catch (err) {
      setActionError(err.message);
      setActionStatus(null);
    }
  }

  async function handleRefund() {
    setActionError(null);
    setActionStatus("Requesting refund... confirm in MetaMask");
    try {
      await refundProject(project.escrowContractAddress, signer);
      setActionStatus("Refund processed.");
      await loadProject();
    } catch (err) {
      setActionError(err.message);
      setActionStatus(null);
    }
  }
  async function handleAssessRisk() {
    setActionError(null);
    setActionStatus("Assessing risk...");
    try {
      const res = await fetch(`${BACKEND_URL}/projects/${project._id}/assess`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionStatus(`Risk assessed: ${data.riskCategory}`);
      await loadProject();
    } catch (err) {
      setActionError(err.message);
      setActionStatus(null);
    }
  }

  async function handleDeployEscrow() {
    setActionError(null);
    setActionStatus("Fetching deployment parameters...");
    try {
      const paramsRes = await fetch(
        `${BACKEND_URL}/projects/${project._id}/deployment-params`,
      );
      const params = await paramsRes.json();
      if (!paramsRes.ok) throw new Error(params.error);

      setActionStatus("Deploying contract... confirm in MetaMask");
      const address = await deployEscrow(params, signer);

      setActionStatus("Saving contract address...");
      await fetch(`${BACKEND_URL}/projects/${project._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowContractAddress: address }),
      });

      setActionStatus(`Escrow deployed at ${address}`);
      await loadProject();
    } catch (err) {
      setActionError(err.message);
      setActionStatus(null);
    }
  }

  async function handleAccept(applicationId) {
    setActionError(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/applications/${applicationId}/accept`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionStatus("Freelancer assigned.");
      await loadProject();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleUpdateRequirements() {
    setActionError(null);
    setActionStatus("Updating requirements...");
    try {
      const res = await fetch(
        `${BACKEND_URL}/projects/${project._id}/requirements`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requirementsText: newRequirements }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (project.escrowContractAddress) {
        setActionStatus(
          "Syncing new requirement hash on-chain... confirm in MetaMask",
        );
        await updateRequirementHashOnChain(
          project.escrowContractAddress,
          signer,
          data.requirementHash,
        );
      }

      setActionStatus(
        `Requirements updated. Scope changes: ${data.scopeChangeCount}`,
      );
      setNewRequirements("");
      await loadProject();
    } catch (err) {
      setActionError(err.message);
      setActionStatus(null);
    }
  }

  async function handleRaiseDispute(index) {
    setActionError(null);
    setActionStatus(`Raising dispute for milestone ${index}...`);
    try {
      const res = await fetch(
        `${BACKEND_URL}/projects/${project._id}/raise-dispute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneIndex: index }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionStatus(`Dispute raised (ID ${data.disputeId})`);
      await loadProject();
    } catch (err) {
      setActionError(err.message);
      setActionStatus(null);
    }
  }

  async function handleVote(voteForFreelancer) {
    setActionError(null);
    setActionStatus("Casting vote... confirm in MetaMask");
    try {
      await castDisputeVote(
        DISPUTE_CONTRACT_ADDRESS,
        project.activeDispute.disputeId,
        signer,
        voteForFreelancer,
      );
      setActionStatus("Vote cast.");
      await loadProject();
    } catch (err) {
      setActionError(err.message);
      setActionStatus(null);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!project) return <p>Project not found.</p>;

  const isClient = project.client === user?._id;
  const isFreelancer = project.freelancer === user?._id;

  return (
    <div>
      <Link to="/">← Back to projects</Link>
      {!walletAddress && (
        <div>
          <p>Connect your wallet to view full project details.</p>
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
      )}
      <h2>{project.title}</h2>
      <p>Budget: {project.budget}</p>
      <p>Complexity: {project.complexity}</p>
      <p>
        Your role on this project:{" "}
        {isClient ? "Client" : isFreelancer ? "Freelancer" : "Unknown"}
      </p>
      {isClient && (
        <div>
          <h3>Requirements</h3>
          <p>Current: {project.requirementsText}</p>
          <p>Scope changes so far: {project.scopeChangeCount}</p>
          <textarea
            placeholder="Propose new requirements"
            value={newRequirements}
            onChange={(e) => setNewRequirements(e.target.value)}
          />
          <br />
          <button
            onClick={handleUpdateRequirements}
            disabled={!newRequirements}
          >
            Update Requirements
          </button>
        </div>
      )}
      {isClient && !project.freelancer && (
        <div>
          <h3>Applications ({applications.length})</h3>
          {applications.length === 0 && <p>No applications yet.</p>}
          <ul>
            {applications.map((a) => (
              <li key={a._id}>
                <strong>{a.freelancer.name}</strong> ({a.freelancer.email}) —{" "}
                {a.status}
                {a.message && <p>"{a.message}"</p>}
                {a.status === "pending" && (
                  <button onClick={() => handleAccept(a._id)}>Accept</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {project.lastRiskAssessment?.riskCategory && (
        <div>
          <h3>Risk Assessment</h3>
          <p>Category: {project.lastRiskAssessment.riskCategory}</p>
          <p>
            Exposure Limit:{" "}
            {project.lastRiskAssessment.exposureLimit?.toFixed(2)}
          </p>
        </div>
      )}

      {isClient &&
        project.freelancer &&
        !project.lastRiskAssessment?.computedAt && (
          <button onClick={handleAssessRisk}>Assess Risk</button>
        )}

      {isClient &&
        project.freelancer &&
        project.lastRiskAssessment?.computedAt &&
        !project.escrowContractAddress && (
          <button onClick={handleDeployEscrow}>
            Deploy Escrow (Fund Project)
          </button>
        )}
      {project.escrowContractAddress ? (
        <div>
          <h3>Milestones</h3>
          <ul>
            {milestones.map((m) => (
              <li key={m.index}>
                Milestone {m.index}: {STATUS_LABELS[m.status]} — amount (wei):{" "}
                {m.amount}
                {isFreelancer && m.status === 0 && (
                  <button onClick={() => handleSubmit(m.index)}>Submit</button>
                )}
                {isClient && m.status === 1 && (
                  <button onClick={() => handleApprove(m.index)}>
                    Approve & Pay
                  </button>
                )}
                {(isClient || isFreelancer) &&
                  m.status === 1 &&
                  !project.activeDispute && (
                    <button onClick={() => handleRaiseDispute(m.index)}>
                      Raise Dispute
                    </button>
                  )}
              </li>
            ))}
          </ul>
          {project.activeDispute &&
            disputeStatus &&
            !disputeStatus.resolved && (
              <div>
                <h3>Active Dispute (ID {project.activeDispute.disputeId})</h3>
                <p>
                  Votes for freelancer: {disputeStatus.freelancerVotes} / Votes
                  for client: {disputeStatus.clientVotes}
                </p>
                <button onClick={() => handleVote(true)}>
                  Vote: Release to Freelancer
                </button>
                <button onClick={() => handleVote(false)}>
                  Vote: Refund Client
                </button>
              </div>
            )}
          {isClient && (
            <button onClick={handleRefund}>
              Request Refund (remaining milestones)
            </button>
          )}
        </div>
      ) : (
        <p>No escrow contract deployed yet for this project.</p>
      )}

      {actionStatus && <p style={{ color: "blue" }}>{actionStatus}</p>}
      {actionError && <p style={{ color: "red" }}>{actionError}</p>}
    </div>
  );
}
