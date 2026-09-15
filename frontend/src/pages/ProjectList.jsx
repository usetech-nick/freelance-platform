import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

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
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p>Connected: {walletAddress}</p>
      {user ? (
        <p>
          Logged in as <strong>{user.name}</strong> ({user.role})
        </p>
      ) : (
        <p style={{ color: "red" }}>{error}</p>
      )}

      <h2>Your Projects</h2>
      {projects.length === 0 && <p>No projects yet.</p>}
      <ul>
        {projects.map((p) => {
          const isClient = p.client._id === user._id;
          return (
            <li key={p._id}>
              <Link to={`/projects/${p._id}`}>
                <strong>{p.title}</strong>
              </Link>{" "}
              — you are the {isClient ? "client" : "freelancer"}
              {p.lastRiskAssessment?.riskCategory && (
                <span> — Risk: {p.lastRiskAssessment.riskCategory}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
