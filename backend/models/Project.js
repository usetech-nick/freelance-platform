const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  complexity: { type: String, enum: ['simple', 'moderate', 'complex', 'very_complex'], required: true },
  scopeChangeCount: { type: Number, default: 0 },

  // Last computed risk result, so the dashboard can read it without recalculating every time
  lastRiskAssessment: {
    projectRisk: Number,
    riskCategory: String,
    exposureLimit: Number,
    milestoneCount: Number,
    computedAt: Date,
  },
});

module.exports = mongoose.model('Project', projectSchema);