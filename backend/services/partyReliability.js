/**
 * STEP 1: Party Reliability
 * -------------------------
 * Answers: "Based on this person's history, how likely are they
 * to succeed on the next contract?"
 */

function successProbability(S, F) {
  const alpha = 1; // "pretend" 1 extra success — prevents 0% for new users
  const beta = 1;  // "pretend" 1 extra failure  — prevents 100% for new users
  return (S + alpha) / (S + F + alpha + beta);
}

function reliabilityRisk(S, F) {
  return 1 - successProbability(S, F);
}
/**
 * Rating risk: higher rating = lower risk.
 * Rating of 5/5 -> 0 risk. Rating of 0/5 -> 1.0 risk (max risk).
 */
function ratingRisk(avgRating) {
  return 1 - avgRating / 5;
}

/**
 * Dispute risk: more disputes relative to completed contracts = higher risk.
 * The "+1" here is the same smoothing idea as Step 1 — stops a brand-new
 * user with 0 contracts and 0 disputes from causing a divide-by-zero.
 */
function disputeRisk(D, C) {
  return D / (C + D + 1);
}

/**
 * Combines reliability, rating, and dispute risk into one PartyRisk score.
 * Weights: 50% reliability, 30% rating, 20% dispute — per the spec.
 * Takes a single object so call sites read clearly, e.g.
 *   calculatePartyRisk({ S: 8, F: 2, avgRating: 4.5, D: 1, C: 8 })
 */
function calculatePartyRisk({ S, F, avgRating, D, C }) {
  const Rp = reliabilityRisk(S, F);
  const Rr = ratingRisk(avgRating);
  const Rd = disputeRisk(D, C);

  const partyRisk = 0.5 * Rp + 0.3 * Rr + 0.2 * Rd;

  return { Rp, Rr, Rd, partyRisk };
}

module.exports = {
  successProbability,
  reliabilityRisk,
  ratingRisk,
  disputeRisk,
  calculatePartyRisk,
};