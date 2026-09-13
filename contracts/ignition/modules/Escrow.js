const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("EscrowModule", (m) => {
  // These are placeholder values for a first test deployment.
  // In real use, your backend will supply real addresses/amounts per project.
  const client = m.getAccount(0);
  const freelancer = m.getAccount(0); // using same account twice just to test deployment mechanics
  const backendOracle = m.getAccount(0);

  const milestoneAmounts = [
    1_000_000_000_000_000n, // 0.001 ETH, in wei
    1_000_000_000_000_000n,
  ];

  const escrow = m.contract(
    "Escrow",
    [
      client,
      freelancer,
      backendOracle,
      1, // riskCategory: Medium
      "0x0000000000000000000000000000000000000000000000000000000000000000".slice(
        0,
        66,
      ), // dummy 32-byte hash
      milestoneAmounts,
    ],
    {
      value: 2_000_000_000_000_000n, // 0.002 ETH total, matching milestone sum
    },
  );

  return { escrow };
});
