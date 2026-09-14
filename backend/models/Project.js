const mongoose = require("mongoose");
const { computeRequirementHash } = require("../services/requirementHash");

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  requirementsText: { type: String, required: true },
  requirementHash: { type: String },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  complexity: {
    type: String,
    enum: ["simple", "moderate", "complex", "very_complex"],
    required: true,
  },
  scopeChangeCount: { type: Number, default: 0 },

  // Last computed risk result, so the dashboard can read it without recalculating every time
  lastRiskAssessment: {
    projectRisk: Number,
    riskCategory: String,
    exposureLimit: Number,
    milestoneCount: Number,
    computedAt: Date,
  },
  escrowContractAddress: { type: String },
});
projectSchema.pre("save", function () {
  if (this.isModified("requirementsText")) {
    const newHash = computeRequirementHash(this.requirementsText);

    if (this.requirementHash && this.requirementHash !== newHash) {
      this.scopeChangeCount += 1;
    }

    this.requirementHash = newHash;
  }
});
module.exports = mongoose.model("Project", projectSchema);
