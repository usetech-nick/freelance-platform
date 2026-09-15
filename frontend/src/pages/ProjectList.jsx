import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiShield,
  FiLock,
  FiGitBranch,
  FiUsers,
  FiFileText,
  FiCheckSquare,
  FiFolder,
  FiActivity,
  FiUser,
  FiChevronRight,
  FiStar,
} from "react-icons/fi";
import { useAuth } from "../AuthContext.jsx";
import { riskBadgeClass } from "../badges.js";
import Register from "./Register.jsx";
import { Notice, Empty, SectionHead } from "../components/ui.jsx";
import { Rating, Stars, TrackRecord } from "../components/Rating.jsx";
import { averageRating } from "../rating.js";

const BACKEND_URL = "http://localhost:3000";

const STEPS = [
  {
    icon: <FiFileText />,
    title: "Post the work",
    text: "Write the requirements once. They are hashed on-chain, so neither side can quietly rewrite the scope later.",
  },
  {
    icon: <FiUsers />,
    title: "Pick a freelancer",
    text: "Review applications, accept one, and the project locks to that pair of wallets.",
  },
  {
    icon: <FiLock />,
    title: "Fund the escrow",
    text: "The budget is split into milestones and held by the contract until work is approved.",
  },
  {
    icon: <FiCheckSquare />,
    title: "Approve and get paid",
    text: "Each approval releases its milestone instantly. If you disagree, a dispute goes to a vote.",
  },
];

const REVIEWS = [
  {
    name: "Ananya",
    role: "client",
    stars: 5,
    text: "I stopped arguing about invoices. The money is already there, so approving a milestone is the only conversation we have.",
  },
  {
    name: "Rohit",
    role: "freelancer",
    stars: 5,
    text: "First platform where I could see the funds locked before I opened the design file. Payment hit my wallet the minute it was approved.",
  },
  {
    name: "Meera",
    role: "client",
    stars: 4,
    text: "Scope changes are recorded instead of argued over. That alone saved us two weeks on the last build.",
  },
];

export default function ProjectList() {
  const { walletAddress, user, error, connectWallet, needsRegistration } =
    useAuth();
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
        <section className="hero">
          <div className="hero-inner">
            <p className="eyebrow">Escrow-backed freelance work</p>
            <h1 className="display">
              Get paid per milestone,
              <br />
              not per promise
            </h1>
            <p className="lead">
              Clients lock the budget in a smart contract before work starts.
              Freelancers submit milestones, clients approve, and the contract
              pays out the same minute.
            </p>
            <div className="rating-hero">
              <Stars value={5} size="1.05rem" />
              <b className="mono">4.9</b>
              <span className="rating-meta">
                average rating from 128 completed contracts
              </span>
            </div>
            <div className="hero-actions btn-row">
              <span className="btn-duo">
                <button className="pill" onClick={connectWallet}>
                  Connect wallet <FiArrowUpRight />
                </button>
                <a className="btn pill secondary" href="#how-it-works">
                  How it works
                </a>
              </span>
            </div>
          </div>

          <div className="trust-strip">
            <span>
              <FiShield /> Funds held in escrow
            </span>
            <span>
              <FiGitBranch /> Scope changes tracked on-chain
            </span>
            <span>
              <FiUsers /> Disputes settled by vote
            </span>
            <span>
              <FiActivity /> Risk scored per project
            </span>
          </div>
        </section>

        <Notice tone="error">{error}</Notice>

        <section id="how-it-works" style={{ marginTop: "4rem" }}>
          <SectionHead title="How it works">
            Four steps from brief to payout.
          </SectionHead>
          <div className="split">
            <div className="card card-lg">
              <div className="steps">
                {STEPS.map((step) => (
                  <div className="step" key={step.title}>
                    <span className="step-icon">{step.icon}</span>
                    <div>
                      <h4>{step.title}</h4>
                      <p>{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card-lg">
              <div className="card-head">
                <h3>
                  <FiLock /> What you need
                </h3>
              </div>
              <p className="card-meta">
                A MetaMask wallet on the Sepolia test network, and a little test
                ETH for gas. Nothing else — there are no accounts or passwords
                here, your wallet is the login.
              </p>
              <button
                className="block"
                style={{ marginTop: "1rem" }}
                onClick={connectWallet}
              >
                Connect wallet <FiArrowUpRight />
              </button>
            </div>
          </div>
        </section>

        <section style={{ marginTop: "4rem" }}>
          <SectionHead title="What people say">
            Ratings follow you across projects and feed the risk score.
          </SectionHead>
          <div className="grid grid-3">
            {REVIEWS.map((r) => (
              <div className="testimonial" key={r.name}>
                <Stars value={r.stars} />
                <p>{r.text}</p>
                <footer>
                  <span className="avatar">{r.name[0]}</span>
                  <span>
                    {r.name} · {r.role}
                  </span>
                </footer>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (needsRegistration) return <Register />;

  const clientCount = projects.filter((p) => p.client._id === user?._id).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>
            Dashboard
          </p>
          <h1>Your projects</h1>
        </div>
        {user ? (
          <p className="muted" style={{ margin: 0 }}>
            Signed in as <strong style={{ color: "var(--text)" }}>{user.name}</strong>{" "}
            <span className="badge badge-role">{user.role}</span>
          </p>
        ) : (
          <Notice tone="error">{error}</Notice>
        )}
      </div>

      <div className="card card-lg" style={{ marginBottom: "1.75rem" }}>
        <div className="card-head">
          <h3>
            <FiStar /> Your reputation
          </h3>
          <span className="badge badge-role">
            {averageRating(user?.ratings).toFixed(1)} / 5
          </span>
        </div>
        <Rating ratings={user?.ratings} size="1.1rem" />
        <TrackRecord user={user} />
        <p className="card-meta" style={{ marginTop: "0.9rem" }}>
          Clients and freelancers both carry a score. It feeds the risk engine,
          which decides how much of a budget an escrow will hold at once.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "2rem" }}>
        <div className="stat">
          <span className="stat-label">
            <FiFolder /> Projects
          </span>
          <span className="stat-value mono">{projects.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">
            <FiUser /> As client
          </span>
          <span className="stat-value mono">{clientCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">
            <FiActivity /> Wallet
          </span>
          <span className="stat-value mono" style={{ fontSize: "0.95rem" }}>
            {walletAddress}
          </span>
        </div>
      </div>

      <section>
        {projects.length === 0 ? (
          <Empty
            title="Nothing here yet"
            hint={
              user?.role === "client"
                ? "Post your first project to start an escrow."
                : "Browse open projects and send your first application."
            }
          >
            <Link
              className="btn"
              style={{ marginTop: "1rem" }}
              to={user?.role === "client" ? "/create" : "/browse"}
            >
              {user?.role === "client" ? "Post a project" : "Find work"}{" "}
              <FiArrowUpRight />
            </Link>
          </Empty>
        ) : (
          <div className="grid grid-2">
            {projects.map((p) => {
              const isClient = p.client._id === user._id;
              return (
                <Link to={`/projects/${p._id}`} key={p._id}>
                  <div className="card card-link" style={{ marginBottom: 0 }}>
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
                      You are the {isClient ? "client" : "freelancer"} · Budget{" "}
                      <span className="mono">{p.budget}</span>
                    </p>
                    <p
                      className="card-meta"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        color: "var(--accent-hi)",
                        marginTop: "0.9rem",
                      }}
                    >
                      Open project <FiChevronRight />
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
