import { useEffect, useState } from "react";
import { FiSend, FiUser, FiDollarSign } from "react-icons/fi";
import { useAuth } from "../AuthContext.jsx";
import { Notice, Empty } from "../components/ui.jsx";
import { Rating, TrackRecord } from "../components/Rating.jsx";

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
      <Empty
        title="Wallet not connected"
        hint="Connect your wallet from the top bar to apply for work."
      />
    );

  const isError = status?.startsWith("Error:");

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>
            Open to applications
          </p>
          <h1>Find work</h1>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {projects.length} project{projects.length === 1 ? "" : "s"} waiting for
          a freelancer
        </p>
      </div>

      {status && (
        <Notice tone={isError ? "error" : "ok"}>
          {isError ? status.replace("Error: ", "") : status}
        </Notice>
      )}

      {projects.length === 0 ? (
        <Empty
          title="No open projects right now"
          hint="New briefs show up here as soon as clients post them."
        />
      ) : (
        <div className="grid grid-2">
          {projects.map((p) => (
            <div className="card" key={p._id} style={{ marginBottom: 0 }}>
              <p className="card-title">{p.title}</p>
              <p
                className="card-meta"
                style={{ display: "flex", gap: "1.1rem", flexWrap: "wrap" }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <FiDollarSign /> <span className="mono">{p.budget}</span>
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <FiUser /> {p.client?.name}
                </span>
              </p>
              <div style={{ marginTop: "0.6rem" }}>
                <Rating ratings={p.client?.ratings} size="0.9rem" />
                <TrackRecord user={p.client} />
              </div>
              <label className="field" style={{ margin: "1rem 0 0.9rem" }}>
                <span className="field-label">Message to the client</span>
                <textarea
                  placeholder="Why you're a good fit, and how you'd approach it."
                  value={messages[p._id] || ""}
                  onChange={(e) =>
                    setMessages({ ...messages, [p._id]: e.target.value })
                  }
                />
              </label>
              <button onClick={() => apply(p._id)}>
                Send application <FiSend />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
