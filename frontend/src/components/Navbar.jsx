import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiTriangle,
  FiMenu,
  FiX,
  FiCheckCircle,
  FiArrowUpRight,
} from "react-icons/fi";
import { useAuth } from "../AuthContext.jsx";

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function Navbar() {
  const { user, walletAddress, connectWallet } = useAuth();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="topbar">
      <div className="wrap topbar-inner">
        <NavLink to="/" className="logo" onClick={close}>
          <FiTriangle />
          ESCROWLY
        </NavLink>

        <nav className={open ? "nav open" : "nav"}>
          <NavLink to="/" end onClick={close}>
            My projects
          </NavLink>
          {user?.role === "client" && (
            <NavLink to="/create" onClick={close}>
              Post a project
            </NavLink>
          )}
          {user?.role === "freelancer" && (
            <NavLink to="/browse" onClick={close}>
              Find work
            </NavLink>
          )}
        </nav>

        <div className="nav-right">
          {walletAddress ? (
            <span className="wallet-chip">
              <FiCheckCircle />
              <span className="addr mono">{shortAddress(walletAddress)}</span>
            </span>
          ) : (
            <button className="pill sm" onClick={connectWallet}>
              Connect wallet <FiArrowUpRight />
            </button>
          )}
          <button
            className="nav-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </header>
  );
}
