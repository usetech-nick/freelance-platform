const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["client", "freelancer"], required: true },
  walletAddress: { type: String, required: true, lowercase: true },

  // Fields the risk engine needs
  completedContracts: { type: Number, default: 0 }, // S
  failedContracts: { type: Number, default: 0 }, // F
  disputeCount: { type: Number, default: 0 }, // D
  ratings: [{ type: Number, min: 0, max: 5 }], // list of individual ratings
});

userSchema.methods.getAvgRating = function () {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((a, b) => a + b, 0);
  return sum / this.ratings.length;
};

module.exports = mongoose.model("User", userSchema);
