import { useCallback, useEffect, useRef, useState } from "react";
import { CELL_ROLE, fetchLayout, fetchRun, generateLayout, GRID_DIMENSIONS } from "./wayfinder-client.js";
import "./App.css";

const DEFAULT_GRID_SIZE = GRID_DIMENSIONS.default;
const EMPTY_METRIC = "—";
const CANVAS_MIN_DIMENSION = 100;
const TRACE_MAX_DIMENSION = 200;
const ALGORITHMS = [{ key: "bfs", label: "BFS", code: 1 }, { key: "dijkstra", label: "Dijkstra", code: 2 }, { key: "astar", label: "A*", code: 3 }];
const INITIAL_ALGORITHM_STATS = Object.fromEntries(ALGORITHMS.map(({ key }) => [key, { runtimeMs: null, visitedCells: null, pathLength: null, totalDistance: null }]));
const roleState = (role) => ["empty", "wall", "start", "end"][role] ?? "empty";

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

function CanvasGrid({ layout, run, showVisitTrace }) {
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
        context.strokeStyle = "#8c52c6"; context.lineWidth = Math.max(2, Math.min(cellWidth, cellHeight) * 0.52); context.lineJoin = "round"; context.lineCap = "round"; context.beginPath();
        run.path.forEach((index, pathIndex) => { const x = (index % layout.gridDims + 0.5) * cellWidth; const y = (Math.floor(index / layout.gridDims) + 0.5) * cellHeight; if (pathIndex === 0) context.moveTo(x, y); else context.lineTo(x, y); });
        context.stroke();
      };
      if (!showVisitTrace) { drawPath(); return; }
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
  }, [layout, run, showVisitTrace]);
  return <canvas ref={canvasRef} className="canvas-grid" role="img" aria-label={`${layout.gridDims} by ${layout.gridDims} pathfinding canvas${showVisitTrace ? ", showing aggregate visit progress" : ", metrics-focused without a visit trace"}`} />;
}

function App() {
  const [layout, setLayout] = useState(null); const [selectedGridDims, setSelectedGridDims] = useState(DEFAULT_GRID_SIZE); const [hasRun, setHasRun] = useState(false); const [serverStatus, setServerStatus] = useState("Checking..."); const [runStatus, setRunStatus] = useState("Idle"); const [isRunning, setIsRunning] = useState(false); const [activeAlgorithm, setActiveAlgorithm] = useState(null); const [algorithmStats, setAlgorithmStats] = useState(INITIAL_ALGORITHM_STATS); const [run, setRun] = useState(null); const [overlay, setOverlay] = useState({ visited: new Set(), path: new Set() });
  const animationRef = useRef({ frameId: null, resolve: null });
  const isCanvasPresentation = layout?.gridDims >= CANVAS_MIN_DIMENSION; const showVisitTrace = layout?.gridDims <= TRACE_MAX_DIMENSION;
  const cancelGridAnimation = useCallback(() => { if (animationRef.current.frameId !== null) cancelAnimationFrame(animationRef.current.frameId); animationRef.current.frameId = null; animationRef.current.resolve?.(); animationRef.current.resolve = null; }, []);
  const applyLayout = useCallback((nextLayout) => { cancelGridAnimation(); setLayout(nextLayout); setRun(null); setHasRun(false); setAlgorithmStats(INITIAL_ALGORITHM_STATS); setOverlay({ visited: new Set(), path: new Set() }); }, [cancelGridAnimation]);
  const loadLayout = useCallback(async () => { const nextLayout = await fetchLayout(); applyLayout(nextLayout); return nextLayout; }, [applyLayout]);
  useEffect(() => { const initialize = async () => { try { const [health] = await Promise.all([fetch("/api/health"), loadLayout()]); if (!health.ok) throw new Error("Health request failed."); setServerStatus(`Online (${(await health.json()).service})`); } catch { setServerStatus("Offline: start the API server on port 3001"); } }; void initialize(); return cancelGridAnimation; }, [cancelGridAnimation, loadLayout]);
  const animateDomRun = useCallback((nextRun) => new Promise((resolve) => { cancelGridAnimation(); animationRef.current.resolve = resolve; const visited = new Set(); const path = new Set(); let visitIndex = 0; let pathIndex = 0; const perFrame = Math.max(1, Math.ceil((nextRun.visitOrder.length + nextRun.path.length) / 150)); const step = () => { let remaining = perFrame; while (remaining > 0 && visitIndex < nextRun.visitOrder.length) { visited.add(nextRun.visitOrder[visitIndex++]); remaining -= 1; } while (remaining > 0 && pathIndex < nextRun.path.length) { path.add(nextRun.path[pathIndex++]); remaining -= 1; } setOverlay({ visited: new Set(visited), path: new Set(path) }); if (visitIndex < nextRun.visitOrder.length || pathIndex < nextRun.path.length) animationRef.current.frameId = requestAnimationFrame(step); else { animationRef.current.frameId = null; animationRef.current.resolve = null; resolve(); } }; animationRef.current.frameId = requestAnimationFrame(step); }), [cancelGridAnimation]);
  const runAlgorithm = useCallback(async ({ key, label, code }) => { if (!layout) return; setIsRunning(true); setActiveAlgorithm(key); setRunStatus(`Running ${label}`); try { const result = await fetchRun(layout, code); if (result.stale) { applyLayout(result.layout); setRunStatus("Layout changed; refreshed current maze."); return; } setHasRun(true); if (layout.gridDims >= CANVAS_MIN_DIMENSION) { setRun(result.run); setRunStatus(showVisitTrace ? `Sweeping ${label}` : `Presenting ${label} metrics and final path`); } else { setRunStatus(`Animating ${label}`); await animateDomRun(result.run); } setAlgorithmStats((previous) => ({ ...previous, [key]: { runtimeMs: result.run.runtimeUs / 1000, visitedCells: result.run.visitOrder.length, pathLength: result.run.path.length, totalDistance: result.run.totalDistance } })); const outcome = result.run.found ? "path found" : "path not found"; setRunStatus(`${label}: ${outcome}; ${result.run.visitOrder.length} visited; path length ${result.run.path.length}; distance ${result.run.totalDistance}; runtime ${(result.run.runtimeUs / 1000).toFixed(2)} ms`); } catch { setRunStatus("Failed"); } finally { setIsRunning(false); setActiveAlgorithm(null); } }, [animateDomRun, applyLayout, layout, showVisitTrace]);
  const cells = !isCanvasPresentation && layout ? Array.from({ length: layout.gridSize }, (_, id) => ({ id, weight: layout.weights[id], state: overlay.path.has(id) && layout.roles[id] === CELL_ROLE.EMPTY ? "path" : overlay.visited.has(id) && layout.roles[id] === CELL_ROLE.EMPTY ? "visited" : roleState(layout.roles[id]) })) : [];
  const weightRange = cells.reduce((range, cell) => ({ min: Math.min(range.min, cell.weight), max: Math.max(range.max, cell.weight) }), { min: Infinity, max: -Infinity });
  const gridCells = cells.map((cell) => { const normalized = weightRange.max > weightRange.min ? (cell.weight - weightRange.min) / (weightRange.max - weightRange.min) : 0; const style = (cell.state === "empty" || cell.state === "visited") ? { backgroundColor: cell.state === "visited" ? "#ffd8ae" : `rgb(${Math.round(255 - 207 * normalized)}, ${Math.round(255 - 167 * normalized)}, ${Math.round(255 - 105 * normalized)})` } : undefined; return <div key={cell.id} className={`cell ${cell.state}`} role="gridcell" aria-label={`Cell ${cell.id}: ${cell.state}`} style={style} />; });
  const startIndex = layout ? layout.roles.findIndex((role) => role === CELL_ROLE.START) : null; const endIndex = layout ? layout.roles.findIndex((role) => role === CELL_ROLE.END) : null; const wallCount = layout ? layout.roles.reduce((count, role) => count + (role === CELL_ROLE.WALL), 0) : 0; const weightSummary = layout ? `${Math.min(...layout.weights)}–${Math.max(...layout.weights)}` : "—";
  return <main className="page"><header className="topbar"><h1>Pathfinding Visualizer</h1><p className="status">{serverStatus}</p></header><section className="panel" aria-label="Grid controls"><p>Current Grid: {layout?.gridDims ?? DEFAULT_GRID_SIZE} × {layout?.gridDims ?? DEFAULT_GRID_SIZE}</p><label className="dimension-control" htmlFor="grid-dimensions">Grid dimension<input id="grid-dimensions" type="number" min={GRID_DIMENSIONS.min} max={GRID_DIMENSIONS.max} value={selectedGridDims} onChange={(event) => setSelectedGridDims(Number(event.target.value))} disabled={isRunning} /></label><div className="panel-actions">{ALGORITHMS.map((algorithm) => <button key={algorithm.key} onClick={() => void runAlgorithm(algorithm)} disabled={isRunning || !layout}>{isRunning && activeAlgorithm === algorithm.key ? "Running..." : `Run ${algorithm.label}`}</button>)}<button onClick={() => { cancelGridAnimation(); setRun(null); setHasRun(false); setOverlay({ visited: new Set(), path: new Set() }); setRunStatus("Idle"); }} disabled={isRunning || !hasRun}>Clear run overlay</button><button onClick={() => void (async () => { setIsRunning(true); setRunStatus(`Generating ${selectedGridDims} × ${selectedGridDims} maze`); try { const nextLayout = await generateLayout(selectedGridDims); applyLayout(nextLayout); setRunStatus(`Generated ${nextLayout.gridDims} × ${nextLayout.gridDims} maze`); } catch (error) { setRunStatus(error.message === "Grid dimension must be between 11 and 317." ? error.message : "Maze generation failed"); } finally { setIsRunning(false); } })()} disabled={isRunning || !Number.isInteger(selectedGridDims) || selectedGridDims < GRID_DIMENSIONS.min || selectedGridDims > GRID_DIMENSIONS.max}>Generate Maze</button></div></section><section className="content-layout">{isCanvasPresentation ? <section className="canvas-area"><section className="canvas-presentation"><CanvasGrid layout={layout} run={run} showVisitTrace={showVisitTrace} /></section>{!showVisitTrace && <p className="high-density-alternative">{layout.gridDims} × {layout.gridDims} Grid. Start index {startIndex}; End index {endIndex}; {wallCount} walls; weights {weightSummary}; final path {run ? (run.found ? "available" : "not available") : "not yet run"}.</p>}</section> : <section className="grid" role="grid" aria-label={`${layout?.gridDims ?? DEFAULT_GRID_SIZE} by ${layout?.gridDims ?? DEFAULT_GRID_SIZE} pathfinding Grid`}>{gridCells}</section>}<aside className="metrics-panel"><h2>Algorithm Performance</h2><table className="metrics-table"><caption className="visually-hidden">Comparable metrics for each pathfinding algorithm</caption><thead><tr><th>Algorithm</th><th>Algorithm Runtime</th><th>Visited Cells</th><th>Path Length</th><th>Total Distance</th></tr></thead><tbody>{ALGORITHMS.map(({ key, label }) => { const metrics = algorithmStats[key]; return <tr key={key}><td>{label}</td><td>{typeof metrics.runtimeMs === "number" ? `${metrics.runtimeMs.toFixed(2)} ms` : EMPTY_METRIC}</td><td>{metrics.visitedCells ?? EMPTY_METRIC}</td><td>{metrics.pathLength ?? EMPTY_METRIC}</td><td>{metrics.totalDistance ?? EMPTY_METRIC}</td></tr>; })}</tbody></table><p className="run-status" role="status" aria-live="polite">Run Status: {runStatus}</p></aside></section></main>;
}
export default App;
