const { ethers } = require('ethers');

/**
 * Turns requirement text into a fixed-length fingerprint.
 * Same text -> same hash, always. Different text -> completely different hash.
 */
function computeRequirementHash(requirementsText) {
  return ethers.keccak256(ethers.toUtf8Bytes(requirementsText));
}

/**
 * Compares a freshly-computed hash against the one stored on the project.
 * Returns true if the requirements have changed since last time.
 */
function hasScopeChanged(storedHash, newRequirementsText) {
  const newHash = computeRequirementHash(newRequirementsText);
  return storedHash !== newHash;
}

module.exports = { computeRequirementHash, hasScopeChanged };