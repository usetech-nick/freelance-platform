import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiFileText,
  FiUsers,
  FiActivity,
  FiLock,
  FiLayers,
  FiExternalLink,
  FiCheck,
  FiUpload,
  FiAlertTriangle,
  FiRefreshCw,
  FiThumbsUp,
  FiThumbsDown,
  FiArrowUpRight,
  FiShield,
  FiCopy,
} from "react-icons/fi";
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
import { Notice, Empty } from "../components/ui.jsx";
import { Rating, TrackRecord } from "../components/Rating.jsx";

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
  const [copied, setCopied] = useState(false);

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
      setActionStatus("Linking dispute contract...");
      await fetch(
        `${BACKEND_URL}/projects/${project._id}/link-dispute-contract`,
        { method: "POST" },
      );
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

  if (loading)
    return (
      <p className="notice busy">
        <span className="spinner" />
        <span>Loading project…</span>
      </p>
    );

  if (!project)
    return (
      <Empty
        title="Project not found"
        hint="The link may be wrong, or the project was removed."
      />
    );

  const isClient = project.client === user?._id;
  const isFreelancer = project.freelancer === user?._id;
  const votesTotal = disputeStatus
    ? disputeStatus.freelancerVotes + disputeStatus.clientVotes
    : 0;

  return (
    <div>
      <Link to="/" className="back-link">
        <FiArrowLeft /> All projects
      </Link>

      {!walletAddress && (
        <div className="card">
          <p style={{ marginBottom: "0.9rem" }}>
            Connect your wallet to see milestones and on-chain actions.
          </p>
          <button onClick={connectWallet}>
            Connect wallet <FiArrowUpRight />
          </button>
        </div>
      )}

      <div className="page-head">
        <div>
          <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>
            Project
          </p>
          <h1>{project.title}</h1>
        </div>
        <p
          className="card-meta"
          style={{ display: "flex", gap: "0.6rem", alignItems: "center", margin: 0 }}
        >
          <span className="mono">Budget {project.budget}</span>
          <span className="badge">{project.complexity}</span>
          <span className="badge badge-role">
            {isClient ? "You: client" : isFreelancer ? "You: freelancer" : "Viewer"}
          </span>
        </p>
      </div>

      {actionStatus && <Notice tone="busy">{actionStatus}</Notice>}
      {actionError && <Notice tone="error">{actionError}</Notice>}

      <div className="split">
        <div>
          {isClient && (
            <section className="card card-lg">
              <div className="card-head">
                <h3>
                  <FiFileText /> Requirements
                </h3>
                <span className="badge">
                  {project.scopeChangeCount} scope change
                  {project.scopeChangeCount === 1 ? "" : "s"}
                </span>
              </div>
              <p style={{ color: "var(--text-soft)" }}>
                {project.requirementsText}
              </p>
              <label className="field" style={{ marginTop: "1.25rem" }}>
                <span className="field-label">Propose new requirements</span>
                <textarea
                  placeholder="Rewrite the scope. The new hash is pushed on-chain so both sides share the same brief."
                  value={newRequirements}
                  onChange={(e) => setNewRequirements(e.target.value)}
                />
              </label>
              <button
                onClick={handleUpdateRequirements}
                disabled={!newRequirements}
              >
                Update requirements <FiRefreshCw />
              </button>
            </section>
          )}

          {isClient && !project.freelancer && (
            <section className="card card-lg">
              <div className="card-head">
                <h3>
                  <FiUsers /> Applications
                </h3>
                <span className="badge">{applications.length}</span>
              </div>
              {applications.length === 0 ? (
                <p className="card-meta">
                  No applications yet. Freelancers see this project under Find
                  work.
                </p>
              ) : (
                applications.map((a) => (
                  <div className="application-row" key={a._id}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "flex-start",
                        minWidth: "220px",
                        flex: 1,
                      }}
                    >
                      <span className="avatar">
                        {a.freelancer.name?.[0]?.toUpperCase()}
                      </span>
                      <div>
                        <p
                          className="card-title"
                          style={{ fontSize: "0.98rem", marginBottom: "0.2rem" }}
                        >
                          {a.freelancer.name}
                          <span
                            className={statusBadgeClass(
                              a.status === "accepted"
                                ? 2
                                : a.status === "rejected"
                                  ? 0
                                  : 1,
                            )}
                          >
                            {a.status}
                          </span>
                        </p>
                        <p className="card-meta">{a.freelancer.email}</p>
                        <div style={{ marginTop: "0.45rem" }}>
                          <Rating ratings={a.freelancer.ratings} size="0.9rem" />
                          <TrackRecord user={a.freelancer} />
                        </div>
                        {a.message && (
                          <p
                            className="card-meta"
                            style={{ color: "var(--text-soft)", marginTop: "0.4rem" }}
                          >
                            {a.message}
                          </p>
                        )}
                      </div>
                    </div>
                    {a.status === "pending" && (
                      <button className="sm" onClick={() => handleAccept(a._id)}>
                        Accept <FiCheck />
                      </button>
                    )}
                  </div>
                ))
              )}
            </section>
          )}

          {project.escrowContractAddress ? (
            <section className="card card-lg">
              <div className="card-head">
                <h3>
                  <FiLayers /> Milestones
                </h3>
                <span className="badge">{milestones.length} total</span>
              </div>

              {milestones.length === 0 && (
                <p className="card-meta">
                  Connect your wallet to read milestones from the contract.
                </p>
              )}

              {milestones.map((m) => (
                <div className="milestone-row" key={m.index}>
                  <span className="milestone-id">
                    <span className="milestone-num mono">{m.index + 1}</span>
                    <span>
                      <span className={statusBadgeClass(m.status)}>
                        {STATUS_LABELS[m.status]}
                      </span>
                      <span
                        className="card-meta mono"
                        style={{ display: "block", marginTop: "0.3rem" }}
                      >
                        {m.amount} wei
                      </span>
                    </span>
                  </span>
                  <span className="btn-row">
                    {isFreelancer && m.status === 0 && (
                      <button className="sm" onClick={() => handleSubmit(m.index)}>
                        Submit work <FiUpload />
                      </button>
                    )}
                    {isClient && m.status === 1 && (
                      <button className="sm" onClick={() => handleApprove(m.index)}>
                        Approve &amp; pay <FiCheck />
                      </button>
                    )}
                    {(isClient || isFreelancer) &&
                      m.status === 1 &&
                      !project.activeDispute && (
                        <button
                          className="secondary sm"
                          onClick={() => handleRaiseDispute(m.index)}
                        >
                          Raise dispute <FiAlertTriangle />
                        </button>
                      )}
                  </span>
                </div>
              ))}

              {isClient && (
                <div style={{ marginTop: "1.25rem" }}>
                  <button className="danger" onClick={handleRefund}>
                    Refund remaining milestones <FiRefreshCw />
                  </button>
                </div>
              )}

              <p className="card-meta" style={{ marginTop: "1.25rem" }}>
                <a
                  className="contract-link"
                  href={`https://sepolia.etherscan.io/address/${project.escrowContractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiExternalLink />
                  <span className="mono">{project.escrowContractAddress}</span>
                </a>
              </p>
            </section>
          ) : (
            <Empty
              title="No escrow yet"
              hint="Once a freelancer is assigned and risk is scored, the client deploys the escrow to fund this project."
            />
          )}

          {project.activeDispute && disputeStatus && !disputeStatus.resolved && (
            <section className="card card-lg">
              <div className="card-head">
                <h3>
                  <FiAlertTriangle /> Active dispute
                </h3>
                <span className="badge badge-pending mono">
                  ID {project.activeDispute.disputeId}
                </span>
              </div>
              <p className="card-meta">
                {disputeStatus.freelancerVotes} for the freelancer ·{" "}
                {disputeStatus.clientVotes} for the client
              </p>
              <div className="vote-bar">
                <i
                  className="for"
                  style={{
                    width: votesTotal
                      ? `${(disputeStatus.freelancerVotes / votesTotal) * 100}%`
                      : "0%",
                  }}
                />
                <i
                  className="against"
                  style={{
                    width: votesTotal
                      ? `${(disputeStatus.clientVotes / votesTotal) * 100}%`
                      : "0%",
                  }}
                />
              </div>
              <div className="btn-row">
                <button onClick={() => handleVote(true)}>
                  Release to freelancer <FiThumbsUp />
                </button>
                <button className="secondary" onClick={() => handleVote(false)}>
                  Refund the client <FiThumbsDown />
                </button>
              </div>
            </section>
          )}
        </div>

        <aside>
          <section className="card card-lg">
            <div className="card-head">
              <h3>
                <FiActivity /> Risk
              </h3>
            </div>
            {project.lastRiskAssessment?.riskCategory ? (
              <>
                <p style={{ marginBottom: "0.6rem" }}>
                  <span
                    className={riskBadgeClass(
                      project.lastRiskAssessment.riskCategory,
                    )}
                  >
                    {project.lastRiskAssessment.riskCategory}
                  </span>
                </p>
                <p className="card-meta">
                  Exposure limit{" "}
                  <span className="mono">
                    {project.lastRiskAssessment.exposureLimit?.toFixed(2)}
                  </span>
                </p>
              </>
            ) : (
              <p className="card-meta">
                Not scored yet. Risk sets how much of the budget the escrow will
                hold at once.
              </p>
            )}

            {isClient &&
              project.freelancer &&
              !project.lastRiskAssessment?.computedAt && (
                <button
                  className="block"
                  style={{ marginTop: "1rem" }}
                  onClick={handleAssessRisk}
                >
                  Assess risk <FiShield />
                </button>
              )}

            {isClient &&
              project.freelancer &&
              project.lastRiskAssessment?.computedAt &&
              !project.escrowContractAddress && (
                <button
                  className="block"
                  style={{ marginTop: "1rem" }}
                  onClick={handleDeployEscrow}
                >
                  Fund escrow <FiLock />
                </button>
              )}
          </section>

          <section className="card card-lg">
            <div className="card-head">
              <h3>
                <FiLock /> Contract
              </h3>
            </div>
            <p className="card-meta" style={{ marginBottom: "0.5rem" }}>
              Escrow
            </p>
            {project.escrowContractAddress ? (
              <>
                <a
                  className="contract-link"
                  href={`https://sepolia.etherscan.io/address/${project.escrowContractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiExternalLink />
                  <span className="mono">{project.escrowContractAddress}</span>
                </a>
                <button
                  className="secondary sm"
                  style={{ marginTop: "0.9rem" }}
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      project.escrowContractAddress,
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                >
                  {copied ? "Copied" : "Copy address"}{" "}
                  {copied ? <FiCheck /> : <FiCopy />}
                </button>
              </>
            ) : (
              <p className="card-meta" style={{ color: "var(--text-soft)" }}>
                Not deployed
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
