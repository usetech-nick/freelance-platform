const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DisputeModule", (m) => {
  const backendOracle = m.getParameter("backendOracle");
  const dispute = m.contract("Dispute", [backendOracle]);
  return { dispute };
});
