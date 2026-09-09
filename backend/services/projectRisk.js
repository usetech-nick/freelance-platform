/**
 * STEP 4: Project-Level Risk Factors
 * ------------------------------------
 * Unlike PartyRisk, these aren't calculated with a formula — they're just
 * "if it falls in this range, use this risk number" lookup tables.
 * Simple on purpose: easy to explain, easy to demo, easy to tune.
 */

/**
 * Project Value Risk (V) — bigger budget = more at stake = more risk.
 */
function projectValueRisk(budget) {
  if (budget <= 5000) return 0.2;
  if (budget <= 20000) return 0.5;
  if (budget <= 50000) return 0.8;
  return 1.0;
}

/**
 * Deadline Risk (T) — less time = more pressure = more risk.
 */
function deadlineRisk(daysUntilDeadline) {
  if (daysUntilDeadline > 30) return 0.2;
  if (daysUntilDeadline >= 15) return 0.4;
  if (daysUntilDeadline >= 7) return 0.7;
  return 1.0;
}

/**
 * Complexity Risk (C) — chosen by the client/admin when creating the project.
 */
function complexityRisk(level) {
  const table = {
    simple: 0.2,
    moderate: 0.5,
    complex: 0.8,
    very_complex: 1.0,
  };
  return table[level];
}

/**
 * Requirement Volatility Risk (Q) — how much has the scope changed?
 */
function requirementVolatilityRisk(changeCount) {
  if (changeCount === 0) return 0.0;
  if (changeCount === 1) return 0.5;
  return 1.0;
}

/**
 * Combines client + freelancer PartyRisk into the single "P" term.
 * Using max() = conservative: the riskier party sets the tone,
 * a clean party doesn't mask a risky one.
 */
function combinePartyRisk(clientPartyRisk, freelancerPartyRisk) {
  return Math.max(clientPartyRisk, freelancerPartyRisk);
}

/**
 * The final ProjectRisk score — weighted sum of all 5 factors.
 * Weights per spec: V=20%, T=15%, C=20%, Q=20%, P=25% (sums to 100%)
 */
function calculateProjectRisk({ V, T, C, Q, P }) {
  return 0.2 * V + 0.15 * T + 0.2 * C + 0.2 * Q + 0.25 * P;
}

/**
 * Turns the 0-1 ProjectRisk number into Low/Medium/High.
 */
function riskCategory(R) {
  if (R < 0.33) return 'Low';
  if (R < 0.66) return 'Medium';
  return 'High';
}

/**
 * STEP 6: Risk -> Escrow decisions
 * ----------------------------------
 * This is where the Risk Engine hands off to the Smart Contract module.
 */

/**
 * Higher risk = less money exposed at once.
 */
function exposureLimit(projectValue, projectRisk) {
  return projectValue * (1 - projectRisk);
}

/**
 * Risk category -> how many milestones the contract should create.
 */
function milestoneCount(category) {
  const table = { Low: 2, Medium: 3, High: 4 };
  return table[category];
}

module.exports = {
  projectValueRisk,
  deadlineRisk,
  complexityRisk,
  requirementVolatilityRisk,
  combinePartyRisk,
  calculateProjectRisk,
  riskCategory,
  exposureLimit,
  milestoneCount
};