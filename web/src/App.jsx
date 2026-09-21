import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CELL_ROLE, decodeLayout, fetchLayout, fetchRun } from "./wayfinder-client.js";
import "./App.css";

const DEFAULT_GRID_SIZE = 20;
const EMPTY_METRIC = "—";
const ALGORITHMS = [{ key: "bfs", label: "BFS", code: 1 }, { key: "dijkstra", label: "Dijkstra", code: 2 }, { key: "astar", label: "A*", code: 3 }];
const INITIAL_ALGORITHM_STATS = Object.fromEntries(ALGORITHMS.map(({ key }) => [key, { runtimeMs: null, visitedCells: null, pathLength: null, totalDistance: null }]));
const roleState = (role) => ["empty", "wall", "start", "end"][role] ?? "empty";

function App() {
  const [layout, setLayout] = useState(null);
  const [run, setRun] = useState(null);
  const [serverStatus, setServerStatus] = useState("Checking...");
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [activeAlgorithm, setActiveAlgorithm] = useState(null);
  const [algorithmStats, setAlgorithmStats] = useState(INITIAL_ALGORITHM_STATS);
  const [overlay, setOverlay] = useState({ visited: new Set(), path: new Set() });
  const animationRef = useRef({ frameId: null, resolve: null });
  const gridRef = useRef(null);

  const cancelGridAnimation = useCallback(() => {
    if (animationRef.current.frameId !== null) cancelAnimationFrame(animationRef.current.frameId);
    animationRef.current.frameId = null;
    animationRef.current.resolve?.();
    animationRef.current.resolve = null;
  }, []);
  const applyLayout = useCallback((nextLayout) => {
    cancelGridAnimation(); setLayout(nextLayout); setRun(null); setOverlay({ visited: new Set(), path: new Set() });
  }, [cancelGridAnimation]);
  const loadLayout = useCallback(async (method = "GET") => {
    if (method === "GET") { const nextLayout = await fetchLayout(); applyLayout(nextLayout); return nextLayout; }
    const response = await fetch("/api/layout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!response.ok) throw new Error("Layout request failed.");
    const nextLayout = decodeLayout(await response.arrayBuffer(), response.headers.get("X-Layout-Id"));
    applyLayout(nextLayout); return nextLayout;
  }, [applyLayout]);
  useEffect(() => {
    const initialize = async () => {
      try {
        const [health] = await Promise.all([fetch("/api/health"), loadLayout()]);
        if (!health.ok) throw new Error("Health request failed.");
        setServerStatus(`Online (${(await health.json()).service})`);
      } catch { setServerStatus("Offline: start the API server on port 3001"); }
    };
    void initialize(); return cancelGridAnimation;
  }, [cancelGridAnimation, loadLayout]);
  useEffect(() => { gridRef.current?.style.setProperty("--grid-columns", String(layout?.gridDims ?? DEFAULT_GRID_SIZE)); }, [layout]);

  const animateRun = useCallback((nextRun) => new Promise((resolve) => {
    cancelGridAnimation(); animationRef.current.resolve = resolve;
    const visited = new Set(); const path = new Set(); let visitIndex = 0; let pathIndex = 0;
    const perFrame = Math.max(1, Math.ceil((nextRun.visitOrder.length + nextRun.path.length) / 150));
    const step = () => {
      let remaining = perFrame;
      while (remaining > 0 && visitIndex < nextRun.visitOrder.length) { visited.add(nextRun.visitOrder[visitIndex++]); remaining -= 1; }
      while (remaining > 0 && pathIndex < nextRun.path.length) { path.add(nextRun.path[pathIndex++]); remaining -= 1; }
      setOverlay({ visited: new Set(visited), path: new Set(path) });
      if (visitIndex < nextRun.visitOrder.length || pathIndex < nextRun.path.length) animationRef.current.frameId = requestAnimationFrame(step);
      else { animationRef.current.frameId = null; animationRef.current.resolve = null; resolve(); }
    };
    animationRef.current.frameId = requestAnimationFrame(step);
  }), [cancelGridAnimation]);
  const runAlgorithm = useCallback(async ({ key, label, code }) => {
    if (!layout) return;
    setIsRunning(true); setActiveAlgorithm(key); setRunStatus(`Running ${label}`);
    try {
      const result = await fetchRun(layout, code);
      if (result.stale) { applyLayout(result.layout); setRunStatus("Layout changed; refreshed current maze."); return; }
      setRun(result.run); setRunStatus(`Animating ${label}`); await animateRun(result.run);
      setAlgorithmStats((previous) => ({ ...previous, [key]: { runtimeMs: result.run.runtimeUs / 1000, visitedCells: result.run.visitOrder.length, pathLength: result.run.path.length, totalDistance: result.run.totalDistance } }));
      setRunStatus(result.run.found ? `${label} complete, path found` : `${label} complete, path not found`);
    } catch { setRunStatus("Failed"); }
    finally { setIsRunning(false); setActiveAlgorithm(null); }
  }, [animateRun, applyLayout, layout]);

  const cells = useMemo(() => layout ? Array.from({ length: layout.gridSize }, (_, id) => ({
    id, weight: layout.weights[id],
    state: overlay.path.has(id) && layout.roles[id] === CELL_ROLE.EMPTY ? "path" : overlay.visited.has(id) && layout.roles[id] === CELL_ROLE.EMPTY ? "visited" : roleState(layout.roles[id]),
  })) : Array.from({ length: DEFAULT_GRID_SIZE ** 2 }, (_, id) => ({ id, state: "empty", weight: 1 })), [layout, overlay]);
  const weightRange = useMemo(() => cells.reduce((range, cell) => ({ min: Math.min(range.min, cell.weight), max: Math.max(range.max, cell.weight) }), { min: Infinity, max: -Infinity }), [cells]);
  const gridCells = useMemo(() => cells.map((cell) => {
    let style;
    if (cell.state === "empty" || cell.state === "visited") {
      const normalized = weightRange.max > weightRange.min ? (cell.weight - weightRange.min) / (weightRange.max - weightRange.min) : 0;
      const [low, high] = cell.state === "empty" ? [[255, 255, 255], [48, 88, 150]] : [[255, 224, 176], [204, 91, 0]];
      style = { backgroundColor: `rgb(${Math.round(low[0] + (high[0] - low[0]) * normalized)}, ${Math.round(low[1] + (high[1] - low[1]) * normalized)}, ${Math.round(low[2] + (high[2] - low[2]) * normalized)})` };
    }
    return <button key={cell.id} type="button" className={`cell ${cell.state}`} aria-label={`Cell ${cell.id}`} style={style} />;
  }), [cells, weightRange]);
  return <main className="page">
    <header className="topbar"><h1>Pathfinding Visualizer</h1><p className="status">{serverStatus}</p></header>
    <section className="panel"><p>Grid: {layout?.gridDims ?? DEFAULT_GRID_SIZE} x {layout?.gridDims ?? DEFAULT_GRID_SIZE}</p><div className="panel-actions">
      {ALGORITHMS.map((algorithm) => <button key={algorithm.key} onClick={() => void runAlgorithm(algorithm)} disabled={isRunning || !layout}>{isRunning && activeAlgorithm === algorithm.key ? "Running..." : `Run ${algorithm.label}`}</button>)}
      <button onClick={() => { cancelGridAnimation(); setRun(null); setOverlay({ visited: new Set(), path: new Set() }); setRunStatus("Idle"); }} disabled={isRunning || !run}>Clear Grid</button>
      <button onClick={() => void (async () => { setIsRunning(true); setRunStatus("Generating maze"); try { await loadLayout("POST"); setRunStatus("Maze generated"); } catch { setRunStatus("Failed"); } finally { setIsRunning(false); } })()} disabled={isRunning}>Generate Maze</button>
    </div></section>
    <section className="content-layout"><section ref={gridRef} className="grid">{gridCells}</section><aside className="metrics-panel"><h2>Algorithm Performance</h2><table className="metrics-table"><thead><tr><th>Algorithm</th><th>Algorithm Runtime</th><th>Visited Cells</th><th>Path Length</th><th>Total Distance</th></tr></thead><tbody>{ALGORITHMS.map(({ key, label }) => { const metrics = algorithmStats[key]; return <tr key={key}><td>{label}</td><td>{typeof metrics.runtimeMs === "number" ? `${metrics.runtimeMs.toFixed(2)} ms` : EMPTY_METRIC}</td><td>{metrics.visitedCells ?? EMPTY_METRIC}</td><td>{metrics.pathLength ?? EMPTY_METRIC}</td><td>{metrics.totalDistance ?? EMPTY_METRIC}</td></tr>; })}</tbody></table><p className="run-status">Run Status: {runStatus}</p></aside></section>
  </main>;
}
export default App;
