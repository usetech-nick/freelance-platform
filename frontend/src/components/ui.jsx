import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInbox,
  FiTriangle,
  FiExternalLink,
  FiShield,
  FiGitBranch,
  FiUsers,
  FiFileText,
  FiLock,
} from "react-icons/fi";

export function Notice({ tone = "busy", children }) {
  if (!children) return null;
  const icon =
    tone === "error" ? (
      <FiAlertCircle />
    ) : tone === "ok" ? (
      <FiCheckCircle />
    ) : (
      <span className="spinner" />
    );
  return (
    <p className={`notice ${tone}`}>
      {icon}
      <span>{children}</span>
    </p>
  );
}

export function Empty({ title, hint, children }) {
  return (
    <div className="empty">
      <FiInbox />
      <h4>{title}</h4>
      {hint && <p className="muted">{hint}</p>}
      {children}
    </div>
  );
}

export function SectionHead({ title, children }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <i />
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="logo">
              <FiTriangle />
              ESCROWLY
            </span>
            <p>
              Freelance work paid the honest way: the budget sits in a smart
              contract, and each approved milestone pays out on its own.
            </p>
            <span className="net-pill">
              <span className="net-dot" />
              Sepolia testnet
            </span>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/">
              <FiFileText /> My projects
            </Link>
            <Link to="/browse">
              <FiUsers /> Find work
            </Link>
            <Link to="/create">
              <FiGitBranch /> Post a project
            </Link>
          </div>

          <div className="footer-col">
            <h4>How it works</h4>
            <span>
              <FiLock /> Escrowed milestones
            </span>
            <span>
              <FiShield /> Risk-based exposure limits
            </span>
            <span>
              <FiUsers /> Disputes settled by vote
            </span>
          </div>

          <div className="footer-col">
            <h4>On-chain</h4>
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noreferrer"
            >
              <FiExternalLink /> Sepolia Etherscan
            </a>
            <a
              href="https://sepolia-faucet.pk910.de"
              target="_blank"
              rel="noreferrer"
            >
              <FiExternalLink /> Get test ETH
            </a>
            <a href="https://metamask.io" target="_blank" rel="noreferrer">
              <FiExternalLink /> Install MetaMask
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Escrowly</span>
          <span>
            Test network only — never send real funds to these contracts.
          </span>
        </div>
      </div>
    </footer>
  );
}
