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
const createMazeSeed = () => Math.floor(Math.random() * 0x7fffffff);

const layoutState = {
  mode: "maze",
  mazeSeed: createMazeSeed(),
};

const baseGridCache = {
  key: null,
  value: null,
};

app.use(express.json());

const isValidCellIndex = (value, gridSize) =>
  Number.isInteger(value) && value >= 0 && value < gridSize;

const sanitizeIndexArray = (value, gridSize) => {
  if (!Array.isArray(value)) return [];

  const out = [];
  const seen = new Set();

  for (const candidate of value) {
    const index = Number(candidate);
    if (!isValidCellIndex(index, gridSize) || seen.has(index)) continue;
    seen.add(index);
    out.push(index);
  }

  return out;
};

const parseEngineOutput = (raw) => {
  try {
    return JSON.parse(raw);
  } catch (_firstError) {
    const openBraces = (raw.match(/{/g) ?? []).length;
    const closeBraces = (raw.match(/}/g) ?? []).length;
    const openBrackets = (raw.match(/\[/g) ?? []).length;
    const closeBrackets = (raw.match(/]/g) ?? []).length;

    let repaired = raw;
    if (openBrackets > closeBrackets) {
      repaired += "]".repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
      repaired += "}".repeat(openBraces - closeBraces);
    }

    return JSON.parse(repaired);
  }
};

const runEngine = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(engineBinaryPath, args, { cwd: rootDir });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(new Error(`Engine timed out after ${ENGINE_TIMEOUT_MS}ms`));
    }, ENGINE_TIMEOUT_MS);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (code !== 0) {
        const detail = stderr.trim();
        reject(new Error(`Engine exited with code ${code}${detail ? `: ${detail}` : ""}`));
        return;
      }

      const raw = stdout.trim();
      if (!raw) {
        reject(new Error("Engine returned empty output"));
        return;
      }

      try {
        resolve(parseEngineOutput(raw));
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Unknown parse error";
        reject(new Error(`Engine returned invalid JSON: ${detail}`));
      }
    });
  });

const ensureEngineBinary = async (res, label) => {
  try {
    await fs.access(engineBinaryPath);
    return true;
  } catch (_error) {
    res.status(500).json({
      ok: false,
      error: `${label} engine binary not found`,
      details: `Build the engine first: make (expected binary at ${engineBinaryPath})`,
    });
    return false;
  }
};

const getLayoutSnapshot = () => {
  if (layoutState.mode === "maze" && Number.isInteger(layoutState.mazeSeed)) {
    return { mode: "maze", mazeSeed: layoutState.mazeSeed };
  }

  return { mode: "empty", mazeSeed: null };
};

const getLayoutKey = (layout) =>
  layout.mode === "maze" ? `maze:${layout.mazeSeed}` : "empty";

const getBaseGridArgs = (layout) =>
  layout.mode === "maze" ? ["maze", String(layout.mazeSeed)] : ["empty"];

const getPathfindingArgs = (algorithm, layout) =>
  layout.mode === "maze"
    ? ["pathfind-maze", algorithm, String(layout.mazeSeed)]
    : ["pathfind-empty", algorithm];

const extractGridShape = (payload, label) => {
  const gridDims = Number(payload?.gridDims);
  const gridSize = Number(payload?.gridSize);
  const expectedSize = gridDims * gridDims;

  if (!Number.isInteger(gridDims) || gridDims < 2) {
    throw new Error(`${label} returned invalid gridDims`);
  }

  if (!Number.isInteger(gridSize) || gridSize !== expectedSize) {
    throw new Error(`${label} returned invalid gridSize`);
  }

  return { gridDims, gridSize };
};

const normalizeGridResult = (rawResult) => {
  const payload = rawResult?.grid ?? rawResult;
  const { gridDims, gridSize } = extractGridShape(payload, "Grid serializer");

  return {
    gridDims,
    gridSize,
    Wall: sanitizeIndexArray(payload?.Wall ?? payload?.wall, gridSize),
    Start: sanitizeIndexArray(payload?.Start ?? payload?.start, gridSize),
    End: sanitizeIndexArray(payload?.End ?? payload?.end, gridSize),
  };
};

const normalizePathfindingResult = (rawResult, baseGrid, algorithm) => {
  const payload = rawResult?.pathfinder ?? rawResult;
  const fallbackDims = Number(baseGrid?.gridDims);
  const fallbackSize = Number(baseGrid?.gridSize);

  const gridDims = Number(payload?.gridDims ?? fallbackDims);
  const gridSize = Number(payload?.gridSize ?? fallbackSize);
  const expectedSize = gridDims * gridDims;

  if (!Number.isInteger(gridDims) || gridDims < 2) {
    throw new Error("Pathfinder serializer returned invalid gridDims");
  }

  if (!Number.isInteger(gridSize) || gridSize !== expectedSize) {
    throw new Error("Pathfinder serializer returned invalid gridSize");
  }

  const algorithmRuntimeUs = Number(payload?.algorithmRuntimeUs);
  if (!Number.isFinite(algorithmRuntimeUs) || algorithmRuntimeUs < 0) {
    throw new Error("Pathfinder serializer returned invalid algorithmRuntimeUs");
  }

  return {
    gridDims,
    gridSize,
    Wall: baseGrid.Wall,
    Start: baseGrid.Start,
    End: baseGrid.End,
    found: Boolean(payload?.found),
    algorithm,
    algorithmRuntimeUs,
    visitOrder: sanitizeIndexArray(payload?.visitOrder ?? payload?.visited, gridSize),
    path: sanitizeIndexArray(payload?.path, gridSize),
  };
};

const fetchBaseGrid = async (layout) => {
  const key = getLayoutKey(layout);

  if (baseGridCache.key === key && baseGridCache.value) {
    return baseGridCache.value;
  }

  const raw = await runEngine(getBaseGridArgs(layout));
  const normalized = normalizeGridResult(raw);

  baseGridCache.key = key;
  baseGridCache.value = normalized;

  return normalized;
};

const handlePathfinding = (algorithm, label) => async (_req, res) => {
  if (!(await ensureEngineBinary(res, label))) return;

  try {
    const layout = getLayoutSnapshot();
    const [baseGrid, rawPath] = await Promise.all([
      fetchBaseGrid(layout),
      runEngine(getPathfindingArgs(algorithm, layout)),
    ]);

    const result = normalizePathfindingResult(rawPath, baseGrid, algorithm);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: `Failed to run ${label}`,
      details: error instanceof Error ? error.message : "Unknown engine error",
    });
  }
};

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pathfinding-server",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/config", async (_req, res) => {
  try {
    const configRaw = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(configRaw);
    res.json({ ok: true, config });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Failed to read config.json",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/grid", async (_req, res) => {
  if (!(await ensureEngineBinary(res, "Grid"))) return;

  try {
    const result = await fetchBaseGrid(getLayoutSnapshot());
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Failed to build base grid",
      details: error instanceof Error ? error.message : "Unknown engine error",
    });
  }
});

app.post("/api/algorithms/bfs", handlePathfinding("bfs", "BFS"));
app.post("/api/algorithms/dijkstra", handlePathfinding("dijkstra", "Dijkstra"));
app.post("/api/algorithms/astar", handlePathfinding("astar", "A*"));

app.post("/api/algorithms/maze", async (_req, res) => {
  if (!(await ensureEngineBinary(res, "Maze"))) return;

  try {
    layoutState.mode = "maze";
    layoutState.mazeSeed = createMazeSeed();

    const result = await fetchBaseGrid(getLayoutSnapshot());
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Failed to run maze generator",
      details: error instanceof Error ? error.message : "Unknown engine error",
    });
  }
});

app.post("/api/grid/clear", async (_req, res) => {
  if (!(await ensureEngineBinary(res, "Grid clear"))) return;

  try {
    const result = await fetchBaseGrid(getLayoutSnapshot());
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Failed to clear grid overlays",
      details: error instanceof Error ? error.message : "Unknown engine error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
