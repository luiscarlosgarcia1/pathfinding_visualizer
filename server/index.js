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

app.use(express.json());

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
        reject(new Error(`Engine exited with code ${code}. ${stderr.trim()}`.trim()));
        return;
      }

      const raw = stdout.trim();
      if (!raw) {
        reject(new Error("Engine returned empty output"));
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(
          new Error(
            `Engine returned invalid JSON: ${error instanceof Error ? error.message : "Unknown parse error"}`,
          ),
        );
      }
    });
  });

const ensureEngineBinary = async (res, errorLabel) => {
  try {
    await fs.access(engineBinaryPath);
    return true;
  } catch (_error) {
    res.status(500).json({
      ok: false,
      error: `${errorLabel} engine binary not found`,
      details: `Build the engine first: make (expected binary at ${engineBinaryPath})`,
    });
    return false;
  }
};

const getBaseGridArgs = () => {
  if (layoutState.mode === "maze" && Number.isInteger(layoutState.mazeSeed)) {
    return ["maze", String(layoutState.mazeSeed)];
  }

  return ["empty"];
};

const getPathfindingArgs = (algorithm) => {
  if (layoutState.mode === "maze" && Number.isInteger(layoutState.mazeSeed)) {
    return ["pathfind-maze", algorithm, String(layoutState.mazeSeed)];
  }

  return ["pathfind-empty", algorithm];
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
    const result = await runEngine(getBaseGridArgs());
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Failed to build base grid",
      details: error instanceof Error ? error.message : "Unknown engine error",
    });
  }
});

app.post("/api/algorithms/bfs", async (_req, res) => {
  if (!(await ensureEngineBinary(res, "BFS"))) return;

  try {
    const args = getPathfindingArgs("bfs");
    const result = await runEngine(args);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Failed to run BFS engine",
      details: error instanceof Error ? error.message : "Unknown engine error",
    });
  }
});

app.post("/api/algorithms/dijkstra", async (_req, res) => {
  if (!(await ensureEngineBinary(res, "Dijkstra"))) return;

  try {
    const args = getPathfindingArgs("dijkstra");
    const result = await runEngine(args);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Failed to run Dijkstra engine",
      details: error instanceof Error ? error.message : "Unknown engine error",
    });
  }
});

app.post("/api/algorithms/maze", async (_req, res) => {
  if (!(await ensureEngineBinary(res, "Maze"))) return;

  try {
    const nextSeed = createMazeSeed();
    layoutState.mode = "maze";
    layoutState.mazeSeed = nextSeed;
    const result = await runEngine(["maze", String(nextSeed)]);
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
    const result = await runEngine(getBaseGridArgs());
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
