import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import {
  submitMilestone,
  approveMilestone,
  refundProject,
  getMilestones,
} from "../escrow.js";

const BACKEND_URL = "http://localhost:3000";
const STATUS_LABELS = ["Pending", "Submitted", "Approved"];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, signer } = useAuth();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [applications, setApplications] = useState([]);

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

  if (loading) return <p>Loading...</p>;
  if (!project) return <p>Project not found.</p>;

  const isClient = project.client === user?._id;
  const isFreelancer = project.freelancer === user?._id;

  return (
    <div>
      <Link to="/">← Back to projects</Link>
      <h2>{project.title}</h2>
      <p>Budget: {project.budget}</p>
      <p>Complexity: {project.complexity}</p>
      <p>
        Your role on this project:{" "}
        {isClient ? "Client" : isFreelancer ? "Freelancer" : "Unknown"}
      </p>
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
              </li>
            ))}
          </ul>
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
