import { useCallback, useEffect, useRef, useState } from "react";
import { AlgorithmPerformance } from "./algorithm-performance.jsx";
import { CELL_ROLE, fetchLayout, fetchRun, generateLayout, GRID_DIMENSIONS } from "./wayfinder-client.js";
import "./App.css";
const ALGORITHMS = [{ key: "bfs", label: "BFS" }, { key: "dijkstra", label: "Dijkstra" }, { key: "astar", label: "A*" }];
const INITIAL_ALGORITHM_STATS = Object.fromEntries(ALGORITHMS.map(({ key }) => [key, { runtimeMs: null, visitedCells: null, pathLength: null, totalDistance: null }]));

const drawBaseGrid = (context, layout, width, height) => {
  const cellWidth = width / layout.gridDims;
  const cellHeight = height / layout.gridDims;
  let min = Infinity; let max = -Infinity;
  for (const weight of layout.weights) { min = Math.min(min, weight); max = Math.max(max, weight); }
  for (let index = 0; index < layout.gridSize; index += 1) {
    const role = layout.roles[index];
    const weight = layout.weights[index];
    const normalized = max > min ? (weight - min) / (max - min) : 0;
    context.fillStyle = role === CELL_ROLE.WALL ? "#000" : role === CELL_ROLE.START ? "#34c759" : role === CELL_ROLE.END ? "#ff3b30" : `rgb(${Math.round(255 - 207 * normalized)}, ${Math.round(255 - 167 * normalized)}, ${Math.round(255 - 105 * normalized)})`;
    context.fillRect((index % layout.gridDims) * cellWidth, Math.floor(index / layout.gridDims) * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight));
  }
  return { cellWidth, cellHeight };
};

function CanvasGrid({ layout, run }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return undefined;
    const context = canvas.getContext("2d");
    const render = () => {
      cancelAnimationFrame(animationRef.current);
      const bounds = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(bounds.width * scale)); canvas.height = Math.max(1, Math.round(bounds.height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const { cellWidth, cellHeight } = drawBaseGrid(context, layout, bounds.width, bounds.height);
      if (!run) return;
      const drawPath = () => {
        if (run.path.length === 0) return;
        context.fillStyle = "#8c52c6";
        run.path.forEach((index) => {
          if (layout.roles[index] !== CELL_ROLE.EMPTY) return;
          context.fillRect((index % layout.gridDims) * cellWidth, Math.floor(index / layout.gridDims) * cellHeight, cellWidth, cellHeight);
        });
      };
      let visited = 0;
      const perFrame = Math.max(1, Math.ceil(run.visitOrder.length / 90));
      const sweep = () => {
        const end = Math.min(run.visitOrder.length, visited + perFrame); context.fillStyle = "rgba(255, 160, 72, 0.68)";
        for (; visited < end; visited += 1) { const index = run.visitOrder[visited]; if (layout.roles[index] === CELL_ROLE.EMPTY) context.fillRect((index % layout.gridDims) * cellWidth, Math.floor(index / layout.gridDims) * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight)); }
        if (visited < run.visitOrder.length) animationRef.current = requestAnimationFrame(sweep); else drawPath();
      };
      animationRef.current = requestAnimationFrame(sweep);
    };
    render();
    const observer = new ResizeObserver(render); observer.observe(canvas);
    return () => { cancelAnimationFrame(animationRef.current); observer.disconnect(); };
  }, [layout, run]);
  return <canvas ref={canvasRef} className="canvas-grid" role="img" aria-label={`${layout.gridDims} by ${layout.gridDims} pathfinding canvas, showing aggregate visit progress`} />;
}

function App() {
  const [layout, setLayout] = useState(null); const [hasRun, setHasRun] = useState(false); const [serverStatus, setServerStatus] = useState("Checking..."); const [runStatus, setRunStatus] = useState("Idle"); const [isRunning, setIsRunning] = useState(false); const [activeAlgorithm, setActiveAlgorithm] = useState(null); const [algorithmStats, setAlgorithmStats] = useState(INITIAL_ALGORITHM_STATS); const [run, setRun] = useState(null);
  const applyLayout = useCallback((nextLayout) => { setLayout(nextLayout); setRun(null); setHasRun(false); setAlgorithmStats(INITIAL_ALGORITHM_STATS); }, []);
  const loadLayout = useCallback(async () => { const nextLayout = await fetchLayout(); applyLayout(nextLayout); return nextLayout; }, [applyLayout]);
  useEffect(() => { const initialize = async () => { try { const [health] = await Promise.all([fetch("/api/health"), loadLayout()]); if (!health.ok) throw new Error("Health request failed."); setServerStatus(`Online (${(await health.json()).service})`); } catch { setServerStatus("Offline: start the API server on port 3001"); } }; void initialize(); }, [loadLayout]);
  const runAlgorithm = useCallback(async ({ key, label }) => { if (!layout) return; setIsRunning(true); setActiveAlgorithm(key); setRunStatus(`Running ${label}`); try { const result = await fetchRun(layout, key); if (result.stale) { applyLayout(result.layout); setRunStatus("Layout changed; refreshed current maze."); return; } setHasRun(true); setRun(result.run); setRunStatus(`Sweeping ${label}`); setAlgorithmStats((previous) => ({ ...previous, [key]: { runtimeMs: result.run.runtimeUs / 1000, visitedCells: result.run.visitOrder.length, pathLength: result.run.path.length, totalDistance: result.run.totalDistance } })); const outcome = result.run.found ? "path found" : "path not found"; setRunStatus(`${label}: ${outcome}; ${result.run.visitOrder.length} visited; path length ${result.run.path.length}; distance ${result.run.totalDistance}; runtime ${(result.run.runtimeUs / 1000).toFixed(2)} ms`); } catch { setRunStatus("Failed"); } finally { setIsRunning(false); setActiveAlgorithm(null); } }, [applyLayout, layout]);
  const startIndex = layout ? layout.roles.findIndex((role) => role === CELL_ROLE.START) : null; const endIndex = layout ? layout.roles.findIndex((role) => role === CELL_ROLE.END) : null; const wallCount = layout ? layout.roles.reduce((count, role) => count + (role === CELL_ROLE.WALL), 0) : 0; const weightSummary = layout ? `${Math.min(...layout.weights)}–${Math.max(...layout.weights)}` : "—";
  return <main className="page"><header className="topbar"><h1>Pathfinding Visualizer</h1><p className="status">{serverStatus}</p></header><section className="panel" aria-label="Grid controls"><p>Current Grid: {GRID_DIMENSIONS} × {GRID_DIMENSIONS}</p><div className="panel-actions">{ALGORITHMS.map((algorithm) => <button key={algorithm.key} onClick={() => void runAlgorithm(algorithm)} disabled={isRunning || !layout}>{isRunning && activeAlgorithm === algorithm.key ? "Running..." : `Run ${algorithm.label}`}</button>)}<button onClick={() => { setRun(null); setHasRun(false); setRunStatus("Idle"); }} disabled={isRunning || !hasRun}>Clear run overlay</button><button onClick={() => void (async () => { setIsRunning(true); setRunStatus(`Generating ${GRID_DIMENSIONS} × ${GRID_DIMENSIONS} maze`); try { const nextLayout = await generateLayout(); applyLayout(nextLayout); setRunStatus(`Generated ${GRID_DIMENSIONS} × ${GRID_DIMENSIONS} maze`); } catch { setRunStatus("Maze generation failed"); } finally { setIsRunning(false); } })()} disabled={isRunning}>Generate Maze</button></div></section><section className="content-layout"><section className="canvas-area"><section className="canvas-presentation"><CanvasGrid layout={layout} run={run} /></section><p className="high-density-alternative">{GRID_DIMENSIONS} × {GRID_DIMENSIONS} Grid. Start index {startIndex}; End index {endIndex}; {wallCount} walls; weights {weightSummary}; final path {run ? (run.found ? "available" : "not available") : "not yet run"}.</p></section><AlgorithmPerformance algorithms={ALGORITHMS} algorithmStats={algorithmStats} runStatus={runStatus} /></section></main>;
}
export default App;
