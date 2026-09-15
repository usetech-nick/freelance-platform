import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";

const BACKEND_URL = "http://localhost:3000";

export default function BrowseProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState({});
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/projects/open`)
      .then((res) => res.json())
      .then(setProjects);
  }, []);

  async function apply(projectId) {
    setStatus(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/projects/${projectId}/applications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            freelancerId: user._id,
            message: messages[projectId] || "",
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus("Applied to project successfully.");
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  if (!user)
    return (
      <p className="card-meta">Connect your wallet from "My Projects" first.</p>
    );

  return (
    <div>
      <h3>Open Projects</h3>
      {status && <p className="status-msg">{status}</p>}
      {projects.length === 0 && (
        <p className="card-meta">No open projects right now.</p>
      )}
      {projects.map((p) => (
        <div className="card" key={p._id}>
          <p className="card-title">{p.title}</p>
          <p className="card-meta">
            Budget: {p.budget} — Client: {p.client?.name}
          </p>
          <textarea
            placeholder="Optional message to the client"
            value={messages[p._id] || ""}
            onChange={(e) =>
              setMessages({ ...messages, [p._id]: e.target.value })
            }
          />
          <button onClick={() => apply(p._id)}>Apply</button>
        </div>
      ))}
    </div>
  );
}
