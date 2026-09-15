import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const BACKEND_URL = "http://localhost:3000";

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
      <p className="card-meta">Connect your wallet from "My Projects" first.</p>
    );
  if (user.role !== "client")
    return <p className="card-meta">Only clients can create projects.</p>;

  return (
    <div className="card">
      <h3>Create Project</h3>
      <input
        placeholder="Title"
        value={form.title}
        onChange={(e) => update("title", e.target.value)}
      />
      <textarea
        placeholder="Requirements"
        value={form.requirementsText}
        onChange={(e) => update("requirementsText", e.target.value)}
      />
      <input
        placeholder="Budget"
        type="number"
        value={form.budget}
        onChange={(e) => update("budget", e.target.value)}
      />
      <input
        placeholder="Deadline (YYYY-MM-DD)"
        value={form.deadline}
        onChange={(e) => update("deadline", e.target.value)}
      />
      <select
        value={form.complexity}
        onChange={(e) => update("complexity", e.target.value)}
      >
        <option value="simple">Simple</option>
        <option value="moderate">Moderate</option>
        <option value="complex">Complex</option>
        <option value="very_complex">Very Complex</option>
      </select>
      <button onClick={handleCreate}>Create Project</button>
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}
