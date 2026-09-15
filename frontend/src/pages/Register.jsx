import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";

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
    <div className="card">
      <h3>Register</h3>
      <p className="card-meta">Wallet: {walletAddress}</p>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <p className="card-meta">I want to register as:</p>
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="client">Client (I want to post projects)</option>
        <option value="freelancer">Freelancer (I want to find work)</option>
      </select>
      <button onClick={handleRegister} disabled={!name || !email}>
        Register
      </button>
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}
