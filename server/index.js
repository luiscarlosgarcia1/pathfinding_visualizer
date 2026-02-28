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

app.use(express.json());

const runBfsEngine = () =>
  new Promise((resolve, reject) => {
    const child = spawn(engineBinaryPath, [], { cwd: rootDir });
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

app.post("/api/algorithms/bfs", async (_req, res) => {
  try {
    await fs.access(engineBinaryPath);
  } catch (_error) {
    res.status(500).json({
      ok: false,
      error: "BFS engine binary not found",
      details: `Build the engine first: make (expected binary at ${engineBinaryPath})`,
    });
    return;
  }

  try {
    const result = await runBfsEngine();
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Failed to run BFS engine",
      details: error instanceof Error ? error.message : "Unknown engine error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
