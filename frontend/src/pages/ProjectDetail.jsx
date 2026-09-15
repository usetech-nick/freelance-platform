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
import { riskBadgeClass, statusBadgeClass } from "../badges.js";

const BACKEND_URL = "http://localhost:3000";
const STATUS_LABELS = ["Pending", "Submitted", "Approved"];
const DISPUTE_CONTRACT_ADDRESS = "0xbA0294c11254A1A42981D6331a04EcCfeF842264";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, signer, walletAddress, connectWallet } = useAuth();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [applications, setApplications] = useState([]);
  const [disputeStatus, setDisputeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [newRequirements, setNewRequirements] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, signer]);

  async function withStatus(startMsg, fn) {
    setActionError(null);
    setActionStatus(startMsg);
    try {
      await fn();
      await loadProject();
    } catch (err) {
      setActionError(err.message);
      setActionStatus(null);
    }
  }

  const handleSubmit = (i) =>
    withStatus(`Submitting milestone ${i}... confirm in MetaMask`, async () => {
      await submitMilestone(project.escrowContractAddress, signer, i);
      setActionStatus("Submitted successfully.");
    });

  const handleApprove = (i) =>
    withStatus(`Approving milestone ${i}... confirm in MetaMask`, async () => {
      await approveMilestone(project.escrowContractAddress, signer, i);
      setActionStatus("Approved and paid successfully.");
    });

  const handleRefund = () =>
    withStatus("Requesting refund... confirm in MetaMask", async () => {
      await refundProject(project.escrowContractAddress, signer);
      setActionStatus("Refund processed.");
    });

  const handleAssessRisk = () =>
    withStatus("Assessing risk...", async () => {
      const res = await fetch(`${BACKEND_URL}/projects/${project._id}/assess`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionStatus(`Risk assessed: ${data.riskCategory}`);
    });

  const handleDeployEscrow = () =>
    withStatus("Fetching deployment parameters...", async () => {
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
    });

  const handleUpdateRequirements = () =>
    withStatus("Updating requirements...", async () => {
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
    });

  const handleAccept = (applicationId) =>
    withStatus("Assigning freelancer...", async () => {
      const res = await fetch(
        `${BACKEND_URL}/applications/${applicationId}/accept`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionStatus("Freelancer assigned.");
    });

  const handleRaiseDispute = (index) =>
    withStatus(`Raising dispute for milestone ${index}...`, async () => {
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
    });

  const handleVote = (voteForFreelancer) =>
    withStatus("Casting vote... confirm in MetaMask", async () => {
      await castDisputeVote(
        DISPUTE_CONTRACT_ADDRESS,
        project.activeDispute.disputeId,
        signer,
        voteForFreelancer,
      );
      setActionStatus("Vote cast.");
    });

  if (loading) return <p className="card-meta">Loading...</p>;
  if (!project) return <p className="error-msg">Project not found.</p>;

  const isClient = project.client === user?._id;
  const isFreelancer = project.freelancer === user?._id;

  return (
    <div>
      <Link to="/">← Back to projects</Link>

      {!walletAddress && (
        <div className="card">
          <p>Connect your wallet to view full project details.</p>
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
      )}

      <h2 style={{ marginBottom: "0.2rem" }}>{project.title}</h2>
      <p className="card-meta">
        Budget: {project.budget} — Complexity: {project.complexity} — Your role:{" "}
        <span className="badge badge-role">
          {isClient ? "Client" : isFreelancer ? "Freelancer" : "Unknown"}
        </span>
      </p>

      {isClient && (
        <section className="card">
          <h3>Requirements</h3>
          <p className="card-meta">Current: {project.requirementsText}</p>
          <p className="card-meta">
            Scope changes so far: {project.scopeChangeCount}
          </p>
          <textarea
            placeholder="Propose new requirements"
            value={newRequirements}
            onChange={(e) => setNewRequirements(e.target.value)}
          />
          <button
            onClick={handleUpdateRequirements}
            disabled={!newRequirements}
          >
            Update Requirements
          </button>
        </section>
      )}

      {isClient && !project.freelancer && (
        <section className="card">
          <h3>Applications ({applications.length})</h3>
          {applications.length === 0 && (
            <p className="card-meta">No applications yet.</p>
          )}
          {applications.map((a) => (
            <div key={a._id} style={{ marginBottom: "0.75rem" }}>
              <strong>{a.freelancer.name}</strong> ({a.freelancer.email})
              <span
                className={statusBadgeClass(
                  a.status === "accepted" ? 2 : a.status === "rejected" ? 0 : 1,
                )}
              >
                {a.status}
              </span>
              {a.message && <p className="card-meta">"{a.message}"</p>}
              {a.status === "pending" && (
                <button onClick={() => handleAccept(a._id)}>Accept</button>
              )}
            </div>
          ))}
        </section>
      )}

      {project.lastRiskAssessment?.riskCategory && (
        <section className="card">
          <h3>Risk Assessment</h3>
          <p>
            Category:{" "}
            <span
              className={riskBadgeClass(
                project.lastRiskAssessment.riskCategory,
              )}
            >
              {project.lastRiskAssessment.riskCategory}
            </span>
          </p>
          <p className="card-meta">
            Exposure Limit:{" "}
            {project.lastRiskAssessment.exposureLimit?.toFixed(2)}
          </p>
        </section>
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
        <section className="card">
          <h3>Milestones</h3>
          {milestones.map((m) => (
            <div className="milestone-row" key={m.index}>
              <span>
                Milestone {m.index}
                <span className={statusBadgeClass(m.status)}>
                  {STATUS_LABELS[m.status]}
                </span>
                <span className="card-meta"> {m.amount} wei</span>
              </span>
              <span>
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
                    <button
                      className="secondary"
                      onClick={() => handleRaiseDispute(m.index)}
                    >
                      Raise Dispute
                    </button>
                  )}
              </span>
            </div>
          ))}
          {isClient && (
            <button className="danger" onClick={handleRefund}>
              Request Refund (remaining milestones)
            </button>
          )}

          <p className="card-meta" style={{ marginTop: "0.75rem" }}>
            Escrow contract:{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${project.escrowContractAddress}`}
              target="_blank"
              rel="noreferrer"
            >
              {project.escrowContractAddress}
            </a>
          </p>
        </section>
      ) : (
        <p className="card-meta">
          No escrow contract deployed yet for this project.
        </p>
      )}

      {project.activeDispute && disputeStatus && !disputeStatus.resolved && (
        <section className="card">
          <h3>Active Dispute (ID {project.activeDispute.disputeId})</h3>
          <p className="card-meta">
            Votes for freelancer: {disputeStatus.freelancerVotes} / Votes for
            client: {disputeStatus.clientVotes}
          </p>
          <button onClick={() => handleVote(true)}>
            Vote: Release to Freelancer
          </button>
          <button className="secondary" onClick={() => handleVote(false)}>
            Vote: Refund Client
          </button>
        </section>
      )}

      {actionStatus && <p className="status-msg">{actionStatus}</p>}
      {actionError && <p className="error-msg">{actionError}</p>}
    </div>
  );
}
