import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number.parseInt(process.env.PORT ?? "3001", 10);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const configPath = path.join(rootDir, "configs", "config.json");
const engineBinaryPath = path.join(rootDir, "cpp-engine", "build", "main");

const ENGINE_TIMEOUT_MS = 5000;
const MIN_GRID_DIMS = 11;
const MAX_GRID_DIMS = 317;
const LAYOUT_HEADER_SIZE = 16;
const RUN_HEADER_SIZE = 40;
const ALGORITHMS = new Set(["bfs", "dijkstra", "astar"]);
const DETAILS = new Set(["full", "metrics"]);
const createMazeSeed = () => Math.floor(Math.random() * 0x7fffffff);
const createLayoutId = () => crypto.randomUUID();

let currentLayout = null;
app.use(express.json({ limit: "1kb" }));

const respondError = (res, status, error) => res.status(status).json({ ok: false, error });
const readUInt16 = (buffer, offset) => buffer.readUInt16LE(offset);
const readUInt32 = (buffer, offset) => buffer.readUInt32LE(offset);
const validGridShape = (gridDims, gridSize) =>
  Number.isInteger(gridDims) && gridDims >= MIN_GRID_DIMS && gridDims <= MAX_GRID_DIMS &&
  Number.isInteger(gridSize) && gridSize === gridDims * gridDims;

const validateLayoutEnvelope = (buffer) => {
  if (buffer.length < LAYOUT_HEADER_SIZE || buffer.subarray(0, 4).toString("ascii") !== "WFL2") {
    throw new Error("invalid Layout envelope");
  }
  if (readUInt16(buffer, 4) !== 2 || readUInt16(buffer, 6) !== 1) {
    throw new Error("unsupported Layout envelope version");
  }
  const gridDims = readUInt32(buffer, 8);
  const gridSize = readUInt32(buffer, 12);
  if (!validGridShape(gridDims, gridSize) || buffer.length !== LAYOUT_HEADER_SIZE + gridSize * 2) {
    throw new Error("invalid Layout envelope shape");
  }
  return { gridDims, gridSize };
};

const validateRunEnvelope = (buffer, expected) => {
  if (buffer.length < RUN_HEADER_SIZE || buffer.subarray(0, 4).toString("ascii") !== "WFR2") {
    throw new Error("invalid Pathfinding run envelope");
  }
  if (readUInt16(buffer, 4) !== 2 || readUInt16(buffer, 6) !== 2) {
    throw new Error("unsupported Pathfinding run envelope version");
  }
  const gridDims = readUInt32(buffer, 8);
  const gridSize = readUInt32(buffer, 12);
  const detail = buffer[17];
  const found = buffer[18];
  const visitCount = readUInt32(buffer, 32);
  const pathLength = readUInt32(buffer, 36);
  if (
    !validGridShape(gridDims, gridSize) || gridDims !== expected.gridDims || gridSize !== expected.gridSize ||
    ![1, 2, 3].includes(buffer[16]) || ![1, 2].includes(detail) || ![0, 1].includes(found) || buffer[19] !== 0 ||
    (detail === 2 && (visitCount !== 0 || pathLength !== 0)) ||
    buffer.length !== RUN_HEADER_SIZE + (visitCount + pathLength) * 4
  ) throw new Error("invalid Pathfinding run envelope shape");
};

const runEngine = (args) => new Promise((resolve, reject) => {
  const child = spawn(engineBinaryPath, args, { cwd: rootDir });
  const stdout = [];
  const stderr = [];
  let settled = false;
  const finish = (callback) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    callback();
  };
  const timeout = setTimeout(() => {
    child.kill("SIGKILL");
    finish(() => reject(new Error("Engine timed out")));
  }, ENGINE_TIMEOUT_MS);
  child.stdout.on("data", (chunk) => stdout.push(chunk));
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  child.on("error", (error) => finish(() => reject(error)));
  child.on("close", (code) => finish(() => {
    if (code !== 0) {
      const detail = Buffer.concat(stderr).toString().trim();
      reject(new Error(`Engine exited with code ${code}${detail ? `: ${detail}` : ""}`));
      return;
    }
    const output = Buffer.concat(stdout);
    if (output.length === 0) reject(new Error("Engine returned empty output"));
    else resolve(output);
  }));
});

const ensureEngineBinary = async (res) => {
  try { await fs.access(engineBinaryPath); return true; }
  catch (_error) { respondError(res, 500, "engine_unavailable"); return false; }
};

const readConfiguredDimensions = async () => {
  const config = JSON.parse(await fs.readFile(configPath, "utf8"));
  const dimensions = Number(config.grid_size);
  if (!Number.isInteger(dimensions) || dimensions < MIN_GRID_DIMS || dimensions > MAX_GRID_DIMS) {
    throw new Error("invalid configured grid size");
  }
  return dimensions;
};

const buildLayout = async (gridDims) => {
  const mazeSeed = createMazeSeed();
  const binary = await runEngine(["layout", String(gridDims), String(mazeSeed)]);
  const shape = validateLayoutEnvelope(binary);
  return { id: createLayoutId(), mazeSeed, binary, ...shape };
};

const sendLayout = (res, layout) => {
  res.set({ "Content-Type": "application/octet-stream", "Content-Length": String(layout.binary.length), "X-Layout-Id": layout.id });
  res.send(layout.binary);
};

const getActiveLayout = async () => {
  if (currentLayout) return currentLayout;
  currentLayout = await buildLayout(await readConfiguredDimensions());
  return currentLayout;
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "pathfinding-server", timestamp: new Date().toISOString() });
});

app.get("/api/config", async (_req, res) => {
  try { res.json({ ok: true, config: JSON.parse(await fs.readFile(configPath, "utf8")) }); }
  catch (_error) { respondError(res, 500, "config_unavailable"); }
});

app.get("/api/layout", async (_req, res) => {
  if (!(await ensureEngineBinary(res))) return;
  try { sendLayout(res, await getActiveLayout()); }
  catch (_error) { respondError(res, 502, "layout_generation_failed"); }
});

app.post("/api/layout", async (req, res) => {
  if (!(await ensureEngineBinary(res))) return;
  const requestedDims = req.body?.gridDims;
  if (requestedDims !== undefined && (!Number.isInteger(requestedDims) || requestedDims < MIN_GRID_DIMS || requestedDims > MAX_GRID_DIMS)) {
    respondError(res, 400, "invalid_grid_dims");
    return;
  }
  try {
    currentLayout = await buildLayout(requestedDims ?? (await readConfiguredDimensions()));
    sendLayout(res, currentLayout);
  } catch (_error) { respondError(res, 502, "layout_generation_failed"); }
});

app.post("/api/runs/:algorithm", async (req, res) => {
  if (!(await ensureEngineBinary(res))) return;
  const { algorithm } = req.params;
  const { layoutId, detail } = req.body ?? {};
  if (!ALGORITHMS.has(algorithm)) return respondError(res, 404, "unknown_algorithm");
  if (typeof layoutId !== "string" || layoutId.length === 0) return respondError(res, 400, "invalid_layout_id");
  const requestedLayout = currentLayout;
  if (layoutId !== requestedLayout?.id) return respondError(res, 409, "stale_layout_id");
  if (!DETAILS.has(detail)) return respondError(res, 400, "invalid_run_detail");
  try {
    const binary = await runEngine(["run", String(requestedLayout.gridDims), String(requestedLayout.mazeSeed), algorithm, detail]);
    validateRunEnvelope(binary, requestedLayout);
    res.set({ "Content-Type": "application/octet-stream", "Content-Length": String(binary.length), "X-Layout-Id": requestedLayout.id });
    res.send(binary);
  } catch (_error) { respondError(res, 502, "pathfinding_run_failed"); }
});

if (process.env.NODE_ENV !== "test") app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));

export { app, validateLayoutEnvelope, validateRunEnvelope };
