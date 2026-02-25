import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number.parseInt(process.env.PORT ?? "3001", 10);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const configPath = path.join(rootDir, "configs", "config.json");

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
