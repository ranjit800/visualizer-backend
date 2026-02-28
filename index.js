/**
 * Visualizer — Express/Node.js Configuration API
 * ─────────────────────────────────────────────────
 * Works in both local dev and on Render.com (production).
 *
 * Local:      persists to ../products-visualizer/data/configurations.json
 * Render:     in-memory storage (resets on server restart — acceptable for demo)
 *
 * Start:  node index.js
 * Port:   process.env.PORT  (Render sets this automatically) or 4000 locally
 */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 4000;
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Storage ───────────────────────────────────────────────────────────────────
// In production (Render) filesystem may be read-only — fall back to in-memory.
const DATA_DIR = path.join(__dirname, "..", "products-visualizer", "data");
const DATA_FILE = path.join(DATA_DIR, "configurations.json");

// In-memory fallback (always used on Render)
const memoryStore = {};

function readStore() {
  if (IS_PRODUCTION) return { ...memoryStore };
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { ...memoryStore };
  }
}

function writeStore(data) {
  // Always keep in-memory copy in sync
  Object.assign(memoryStore, data);

  if (IS_PRODUCTION) return; // no filesystem write on Render
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // non-fatal — in-memory already updated
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    port: PORT,
    storage: IS_PRODUCTION ? "in-memory" : "file",
    configs: Object.keys(readStore()).length,
  });
});

// POST /api/configurations — Save a configuration
app.post("/api/configurations", (req, res) => {
  const { productSlug, materials, components, lightingPreset, exposure, camera, name } = req.body;

  if (!productSlug || typeof productSlug !== "string") {
    return res.status(400).json({ error: "productSlug is required and must be a string" });
  }

  const id = uuidv4().replace(/-/g, "").slice(0, 16);
  const config = {
    id,
    productSlug,
    materials: materials ?? {},
    components: components ?? {},
    lightingPreset: lightingPreset ?? "studio",
    exposure: typeof exposure === "number" ? exposure : undefined,
    camera: camera ?? { azimuth: 0, elevation: 15, distance: 3 },
    createdAt: new Date().toISOString(),
    name: typeof name === "string" ? name : undefined,
  };

  const store = readStore();
  store[id] = config;
  writeStore(store);

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  console.log(`  ✓ Saved config [${id}] for product "${productSlug}"`);
  res.status(201).json({ id, shareUrl: `${baseUrl}/share/${id}` });
});

// GET /api/configurations — List all
app.get("/api/configurations", (_req, res) => {
  const store = readStore();
  const configs = Object.values(store);
  res.json({ count: configs.length, configs });
});

// GET /api/configurations/:id — Get one
app.get("/api/configurations/:id", (req, res) => {
  const store = readStore();
  const config = store[req.params.id];
  if (!config) {
    return res.status(404).json({ error: "Configuration not found", id: req.params.id });
  }
  res.json(config);
});

// DELETE /api/configurations/:id — Delete one
app.delete("/api/configurations/:id", (req, res) => {
  const store = readStore();
  if (!store[req.params.id]) {
    return res.status(404).json({ error: "Configuration not found" });
  }
  delete store[req.params.id];
  delete memoryStore[req.params.id];
  writeStore(store);
  res.json({ message: "Deleted", id: req.params.id });
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
  console.log(`  ➜   Storage: ${IS_PRODUCTION ? "in-memory (Render)" : `file → ${DATA_FILE}`}`);
  console.log("");
  console.log("  Routes:");
  console.log("    GET    /health");
  console.log("    POST   /api/configurations");
  console.log("    GET    /api/configurations");
  console.log("    GET    /api/configurations/:id");
  console.log("    DELETE /api/configurations/:id");
  console.log("");
});
