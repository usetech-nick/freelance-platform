import { useState } from "react";
import { FiBriefcase, FiCode, FiArrowUpRight, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../AuthContext.jsx";
import { Notice } from "../components/ui.jsx";

export default function Register() {
  const { walletAddress, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("client");
  const [error, setError] = useState(null);

  async function handleRegister() {
    setError(null);
    const ok = await register({ name, email, role });
    if (!ok) setError("Registration failed. Try a different email.");
  }

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto" }}>
      <div className="card card-lg">
        <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>
          One-time setup
        </p>
        <h1 className="display" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
          Create your profile
        </h1>
        <p className="lead" style={{ margin: "0.9rem 0 1.75rem" }}>
          This wallet isn&apos;t linked to a profile yet. Tell us who you are and
          you&apos;re in.
        </p>

        <p className="wallet-chip" style={{ marginBottom: "1.75rem" }}>
          <FiCheckCircle />
          <span className="mono">{walletAddress}</span>
        </p>

        <label className="field">
          <span className="field-label">Name</span>
          <input
            placeholder="Jane Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <input
            placeholder="jane@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <div className="field">
          <span className="field-label">I&apos;m here to</span>
          <div className="choice-grid">
            <button
              type="button"
              className="choice"
              aria-pressed={role === "client"}
              onClick={() => setRole("client")}
            >
              <strong>
                <FiBriefcase /> Hire
              </strong>
              <small>Post projects and fund milestones.</small>
            </button>
            <button
              type="button"
              className="choice"
              aria-pressed={role === "freelancer"}
              onClick={() => setRole("freelancer")}
            >
              <strong>
                <FiCode /> Work
              </strong>
              <small>Apply to projects and get paid per milestone.</small>
            </button>
          </div>
        </div>

        <button className="block" onClick={handleRegister} disabled={!name || !email}>
          Create profile <FiArrowUpRight />
        </button>

        <Notice tone="error">{error}</Notice>
      </div>
    </div>
  );
}
