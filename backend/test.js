const { successProbability, reliabilityRisk } = require('./services/partyReliability');

console.log('--- New user (no history) ---');
console.log('Success probability:', successProbability(0, 0));
console.log('Risk:', reliabilityRisk(0, 0));

console.log('\n--- Freelancer: 8 completed, 2 failed ---');
console.log('Success probability:', successProbability(8, 2));
console.log('Risk:', reliabilityRisk(8, 2));

const { ratingRisk, disputeRisk } = require('./services/partyReliability');

console.log('\n--- Rating risk: 4.5/5 ---');
console.log('Rating risk:', ratingRisk(4.5)); // should be 0.10

console.log('\n--- Dispute risk: 1 dispute, 8 completed contracts ---');
console.log('Dispute risk:', disputeRisk(1, 8)); // should be 0.10


const { calculatePartyRisk } = require('./services/partyReliability');

console.log('\n--- Full PartyRisk: freelancer with 8 completed, 2 failed, 4.5 rating, 1 dispute ---');
console.log(calculatePartyRisk({ S: 8, F: 2, avgRating: 4.5, D: 1, C: 8 }));

const {
  projectValueRisk,
  deadlineRisk,
  complexityRisk,
  requirementVolatilityRisk,
} = require('./services/projectRisk');

console.log('\n--- Project factors: budget 25000, 10 days left, complex, 1 scope change ---');
console.log('V (value risk):', projectValueRisk(25000));       // expect 0.8
console.log('T (deadline risk):', deadlineRisk(10));           // expect 0.7
console.log('C (complexity risk):', complexityRisk('complex'));// expect 0.8
console.log('Q (volatility risk):', requirementVolatilityRisk(1)); // expect 0.5

const { combinePartyRisk, calculateProjectRisk, riskCategory, exposureLimit, milestoneCount } = require('./services/projectRisk');

console.log('\n--- FULL PIPELINE: client + freelancer + project ---');

const clientRisk = calculatePartyRisk({ S: 15, F: 1, avgRating: 4.7, D: 0, C: 15 });
const freelancerRisk = calculatePartyRisk({ S: 8, F: 2, avgRating: 4.5, D: 1, C: 8 });

console.log('Client PartyRisk:', clientRisk.partyRisk);
console.log('Freelancer PartyRisk:', freelancerRisk.partyRisk);

const P = combinePartyRisk(clientRisk.partyRisk, freelancerRisk.partyRisk);
const V = projectValueRisk(25000);
const T = deadlineRisk(10);
const C = complexityRisk('complex');
const Q = requirementVolatilityRisk(1);

const projectRisk = calculateProjectRisk({ V, T, C, Q, P });

console.log('ProjectRisk:', projectRisk);
console.log('Risk Category:', riskCategory(projectRisk));

console.log('\n--- Escrow decisions ---');
console.log('Exposure Limit:', exposureLimit(25000, projectRisk)); // expect 10781.25
console.log('Milestone Count:', milestoneCount(riskCategory(projectRisk))); // expect 3


const { computeRequirementHash, hasScopeChanged } = require('./services/requirementHash');

console.log('\n--- Requirement hashing ---');
const original = 'Build a 5-page website with a contact form';
const hash1 = computeRequirementHash(original);
console.log('Hash:', hash1);

const sameText = 'Build a 5-page website with a contact form';
console.log('Same text, scope changed?', hasScopeChanged(hash1, sameText)); // expect false

const editedText = 'Build a 10-page website with a contact form and blog';
console.log('Edited text, scope changed?', hasScopeChanged(hash1, editedText)); // expect true