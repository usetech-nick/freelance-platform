import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { riskBadgeClass } from "../badges.js";

const BACKEND_URL = "http://localhost:3000";

export default function ProjectList() {
  const { walletAddress, user, error, connectWallet } = useAuth();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetch(`${BACKEND_URL}/users/${user._id}/projects`)
      .then((res) => res.json())
      .then(setProjects);
  }, [user]);

  if (!walletAddress) {
    return (
      <div>
        <button onClick={connectWallet}>Connect Wallet</button>
        {error && <p className="error-msg">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="card-meta">Connected: {walletAddress}</p>
      {user ? (
        <p>
          Logged in as <strong>{user.name}</strong>
          <span className="badge badge-role">{user.role}</span>
        </p>
      ) : (
        <p className="error-msg">{error}</p>
      )}

      <section>
        <h3>Your Projects</h3>
        {projects.length === 0 && <p className="card-meta">No projects yet.</p>}
        {projects.map((p) => {
          const isClient = p.client._id === user._id;
          return (
            <Link
              to={`/projects/${p._id}`}
              key={p._id}
              style={{ display: "block" }}
            >
              <div className="card">
                <p className="card-title">
                  {p.title}
                  {p.lastRiskAssessment?.riskCategory && (
                    <span
                      className={riskBadgeClass(
                        p.lastRiskAssessment.riskCategory,
                      )}
                    >
                      {p.lastRiskAssessment.riskCategory} risk
                    </span>
                  )}
                </p>
                <p className="card-meta">
                  You are the {isClient ? "client" : "freelancer"} — Budget:{" "}
                  {p.budget}
                </p>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
