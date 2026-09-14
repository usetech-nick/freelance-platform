require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { calculatePartyRisk } = require("./services/partyReliability");
const { getEscrowDeploymentParams } = require("./services/blockchain");
const cors = require("cors");
const {
  projectValueRisk,
  deadlineRisk,
  complexityRisk,
  requirementVolatilityRisk,
  combinePartyRisk,
  calculateProjectRisk,
  riskCategory,
  exposureLimit,
  milestoneCount,
} = require("./services/projectRisk");

const app = express();
app.use(express.json()); // lets Express read JSON request bodies
app.use(cors());
const User = require("./models/User");
const Project = require("./models/Project");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = 3000;
app.get("/", (req, res) => {
  res.send("Freelance platform backend is running");
});
app.get("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/test-user", async (req, res) => {
  const user = await User.create({
    name: "Test Freelancer",
    email: "test@example.com",
    role: "freelancer",
    completedContracts: 8,
    failedContracts: 2,
    disputeCount: 1,
    ratings: [4, 5, 4.5],
  });
  res.json(user);
});

app.post("/projects", async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/projects/:id/assess", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("client")
      .populate("freelancer");

    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!project.freelancer)
      return res.status(400).json({ error: "No freelancer assigned yet" });

    const clientRisk = calculatePartyRisk({
      S: project.client.completedContracts,
      F: project.client.failedContracts,
      avgRating: project.client.getAvgRating(),
      D: project.client.disputeCount,
      C: project.client.completedContracts,
    });

    const freelancerRisk = calculatePartyRisk({
      S: project.freelancer.completedContracts,
      F: project.freelancer.failedContracts,
      avgRating: project.freelancer.getAvgRating(),
      D: project.freelancer.disputeCount,
      C: project.freelancer.completedContracts,
    });

    const daysUntilDeadline = Math.ceil(
      (project.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    const V = projectValueRisk(project.budget);
    const T = deadlineRisk(daysUntilDeadline);
    const C = complexityRisk(project.complexity);
    const Q = requirementVolatilityRisk(project.scopeChangeCount);
    const P = combinePartyRisk(clientRisk.partyRisk, freelancerRisk.partyRisk);

    const projectRiskValue = calculateProjectRisk({ V, T, C, Q, P });
    const category = riskCategory(projectRiskValue);
    const exposure = exposureLimit(project.budget, projectRiskValue);
    const milestones = milestoneCount(category);

    project.lastRiskAssessment = {
      projectRisk: projectRiskValue,
      riskCategory: category,
      exposureLimit: exposure,
      milestoneCount: milestones,
      computedAt: new Date(),
    };
    await project.save();

    res.json({
      client: clientRisk,
      freelancer: freelancerRisk,
      factors: { V, T, C, Q, P },
      projectRisk: projectRiskValue,
      riskCategory: category,
      exposureLimit: exposure,
      milestoneCount: milestones,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/projects/:id/requirements", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    project.requirementsText = req.body.requirementsText;
    await project.save(); // triggers the pre-save hook above

    res.json({
      requirementHash: project.requirementHash,
      scopeChangeCount: project.scopeChangeCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/projects/:id/deployment-params", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("client")
      .populate("freelancer");

    if (!project) return res.status(404).json({ error: "Project not found" });

    const params = getEscrowDeploymentParams(project);
    res.json(params);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.patch("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
