/**
 * Visualizer — Express/Node.js Configuration API
 * ─────────────────────────────────────────────────
 * Now backed by MongoDB for permanent storage
 *
 * Start:  node index.js
 * Port:   process.env.PORT (Render) or 4000 locally
 */

require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Configuration = require("./src/models/Configuration");

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Database Connection ───────────────────────────────────────────────────────
if (!MONGODB_URI) {
  console.error("FATAL: MONGODB_URI environment variable is not defined");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✓ Connected to MongoDB"))
  .catch((err) => {
    console.error("✗ Failed to connect to MongoDB", err);
    process.exit(1);
  });

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/health", async (_req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const count = isDbConnected ? await Configuration.countDocuments() : 0;
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      port: PORT,
      database: isDbConnected ? "connected" : "disconnected",
      configsCount: count,
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// POST /api/configurations — Save a configuration
app.post("/api/configurations", async (req, res) => {
  const { productSlug, materials, components, lightingPreset, exposure, camera, name } = req.body;

  if (!productSlug || typeof productSlug !== "string") {
    return res.status(400).json({ error: "productSlug is required and must be a string" });
  }

  try {
    const id = uuidv4().replace(/-/g, "").slice(0, 16);
    
    const newConfig = new Configuration({
      id,
      productSlug,
      materials: materials ?? {},
      components: components ?? {},
      lightingPreset: lightingPreset ?? "studio",
      exposure: typeof exposure === "number" ? exposure : undefined,
      camera: camera ?? { azimuth: 0, elevation: 15, distance: 3 },
      name: typeof name === "string" ? name : undefined,
    });

    await newConfig.save();

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    console.log(`  ✓ Saved config [${id}] for product "${productSlug}" to MongoDB`);
    res.status(201).json({ id, shareUrl: `${baseUrl}/share/${id}` });
  } catch (err) {
    console.error("Error saving configuration:", err);
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

// GET /api/configurations — List all
app.get("/api/configurations", async (_req, res) => {
  try {
    const configs = await Configuration.find().sort({ createdAt: -1 });
    // Transform from MongoDB document format to plain objects to match previous API format
    const transformedConfigs = configs.map(c => {
      const plain = c.toObject();
      delete plain._id;
      delete plain.__v;
      return plain;
    });
    
    res.json({ count: transformedConfigs.length, configs: transformedConfigs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch configurations" });
  }
});

// GET /api/configurations/:id — Get one
app.get("/api/configurations/:id", async (req, res) => {
  try {
    const config = await Configuration.findOne({ id: req.params.id });
    
    if (!config) {
      return res.status(404).json({ error: "Configuration not found", id: req.params.id });
    }
    
    const plainConfig = config.toObject();
    delete plainConfig._id;
    delete plainConfig.__v;
    
    res.json(plainConfig);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch configuration" });
  }
});

// DELETE /api/configurations/:id — Delete one
app.delete("/api/configurations/:id", async (req, res) => {
  try {
    const result = await Configuration.deleteOne({ id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Configuration not found" });
    }
    
    res.json({ message: "Deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete configuration" });
  }
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("");
  console.log("  🚀  Visualizer API Server");
  console.log(`  ➜   http://localhost:${PORT}`);
  console.log(`  ➜   Storage: MongoDB Database`);
  console.log("");
  console.log("  Routes:");
  console.log("    GET    /health");
  console.log("    POST   /api/configurations");
  console.log("    GET    /api/configurations");
  console.log("    GET    /api/configurations/:id");
  console.log("    DELETE /api/configurations/:id");
  console.log("");
});
