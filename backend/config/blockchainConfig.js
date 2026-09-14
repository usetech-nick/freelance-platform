module.exports = {
  // MVP conversion rate: purely for demo purposes on testnet.
  // Real production version would integrate a payment gateway or stablecoin,
  // not a hardcoded budget->ETH rate.
  BUDGET_TO_ETH_RATE: 0.001 / 1000, // 1000 budget units = 0.001 ETH
};
