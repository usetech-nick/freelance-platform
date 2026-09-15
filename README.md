# Risk-Adaptive Smart Escrow for Decentralized Freelancing

A decentralized freelance platform where escrow behavior adapts to a computed risk score, based on party reliability, project characteristics, and requirement stability, rather than using fixed milestone terms for every project.

## Architecture

- **backend/** — Node.js/Express API, MongoDB (Mongoose), risk engine, requirement hashing, job applications
- **contracts/** — Solidity smart contracts (Hardhat), deployed and verified on Sepolia testnet
- **frontend/** — React (Vite) app with MetaMask wallet-based authentication

## Core Features

- **Risk Engine**: Laplace-smoothed party reliability, weighted party/project risk scoring, risk-based milestone count and exposure limits
- **Requirement Commitments**: Keccak-256 hash of project requirements, scope-change detection
- **Escrow.sol**: per-project deployed contract — deposit, milestone submit/approve, refund, oracle-controlled risk/scope updates
- **Dispute.sol**: 3-verifier, 2-of-3 majority dispute resolution, integrated with Escrow via cross-contract calls
- **Job Applications**: clients post projects, freelancers browse and apply, clients accept
- **Full React frontend**: wallet-based registration/login, role-aware project views, live on-chain milestone/dispute actions

## Deployed Contracts (Sepolia Testnet)

- Dispute contract: `0xbA0294c11254A1A42981D6331a04EcCfeF842264`
- Escrow contracts are deployed per-project (example, verified): `0x8eAAA159d616f36fd491EC6E4BfB74D9ab6ffb7f`
  - Verified source: https://sepolia.etherscan.io/address/0x8eAAA159d616f36fd491EC6E4BfB74D9ab6ffb7f#code

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in real values
node server.js
```

### Smart Contracts
```bash
cd contracts
npm install
cp .env.example .env   # fill in real values
npx hardhat compile
npx hardhat test
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing

- 13 automated Hardhat tests covering deposit, milestone flow, refund, and dispute resolution (`cd contracts && npx hardhat test`)
- Full manual end-to-end test performed via the live UI with 5 independent wallets on Sepolia: registration, project creation, application, acceptance, risk assessment, escrow deployment, normal settlement, and dispute resolution

## Known Limitations

- Verifier selection is a fixed, hardcoded set for this prototype (explicitly scoped as future work)
- No dispute voting timeout/reassignment mechanism
- Scope changes are currently client-driven with an audit trail, not yet a two-party mutual-approval workflow
- One role (client or freelancer) per wallet address; no role-switching per account
- Budget-to-ETH conversion uses a fixed placeholder rate for testnet demo purposes

## Tech Stack

Node.js, Express, MongoDB/Mongoose, Solidity 0.8.28, Hardhat 2, ethers.js, React, Vite, MetaMask
