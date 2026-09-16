import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowUpRight,
  FiInfo,
  FiLock,
  FiGitBranch,
  FiActivity,
} from "react-icons/fi";
import { useAuth } from "../AuthContext.jsx";
import { Notice, Empty } from "../components/ui.jsx";

const BACKEND_URL = "http://localhost:3000";

const COMPLEXITY = [
  { value: "simple", label: "Simple", hint: "One clear deliverable" },
  { value: "moderate", label: "Moderate", hint: "A few moving parts" },
  { value: "complex", label: "Complex", hint: "Multiple systems involved" },
  { value: "very_complex", label: "Very complex", hint: "Long, open-ended build" },
];

export default function CreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    requirementsText: "",
    budget: "",
    deadline: "",
    complexity: "simple",
  });
  const [error, setError] = useState(null);

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function handleCreate() {
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget: Number(form.budget),
          client: user._id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      navigate(`/projects/${data._id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user)
    return (
      <Empty
        title="Wallet not connected"
        hint="Connect your wallet from the top bar to post a project."
      />
    );

  if (user.role !== "client")
    return (
      <Empty
        title="Freelancer account"
        hint="Only client accounts can post projects. Head to Find work to see what's open."
      />
    );

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>
            New project
          </p>
          <h1>Post a project</h1>
        </div>
      </div>

      <div className="split">
        <div className="card card-lg">
          <label className="field">
            <span className="field-label">Project title</span>
            <input
              placeholder="Landing page for a fintech app"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Requirements</span>
            <textarea
              placeholder="What needs to be built, what counts as done, and anything the freelancer must know up front."
              value={form.requirementsText}
              onChange={(e) => update("requirementsText", e.target.value)}
            />
            <span className="muted">
              This text is hashed on-chain. Later edits are recorded as scope
              changes.
            </span>
          </label>

          <div className="grid grid-2">
            <label className="field">
              <span className="field-label">Budget (₹)</span>
              <input
                placeholder="50000"
                type="number"
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Deadline</span>
              <input
                placeholder="YYYY-MM-DD"
                value={form.deadline}
                onChange={(e) => update("deadline", e.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <span className="field-label">Complexity</span>
            <div className="choice-grid">
              {COMPLEXITY.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className="choice"
                  aria-pressed={form.complexity === c.value}
                  onClick={() => update("complexity", c.value)}
                >
                  <strong>{c.label}</strong>
                  <small>{c.hint}</small>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleCreate}>
            Post project <FiArrowUpRight />
          </button>

          <Notice tone="error">{error}</Notice>
        </div>

        <div className="card card-lg">
          <div className="card-head">
            <h3>
              <FiInfo /> What happens next
            </h3>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-icon">
                <FiGitBranch />
              </span>
              <div>
                <h4>Applications come in</h4>
                <p>Accept one freelancer to lock the project to their wallet.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-icon">
                <FiActivity />
              </span>
              <div>
                <h4>Risk is scored</h4>
                <p>
                  The platform assesses the project and sets an exposure limit
                  for the escrow.
                </p>
              </div>
            </div>
            <div className="step">
              <span className="step-icon">
                <FiLock />
              </span>
              <div>
                <h4>You fund the escrow</h4>
                <p>
                  Deploy the contract from the project page. Money moves only on
                  your approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
