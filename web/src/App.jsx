import { useEffect, useRef, useState } from "react";
import "./App.css";

const DEFAULT_GRID_SIZE = 20;
const EMPTY_METRIC = "—";
const INITIAL_ALGORITHM_STATS = {
  bfs: {
    runtimeMs: null,
    visitedCells: null,
    pathLength: null,
  },
  dijkstra: {
    runtimeMs: null,
    visitedCells: null,
    pathLength: null,
  },
  astar: {
    runtimeMs: null,
    visitedCells: null,
    pathLength: null,
  },
};

const engineStateToUiState = (state) => {
  if (state === "Start") return "start";
  if (state === "End") return "end";
  if (state === "Wall") return "wall";
  return "empty";
};

const createPlaceholderGrid = (size) =>
  Array.from({ length: size * size }, (_, index) => ({
    id: index,
    state: "empty",
  }));

const cloneGrid = (grid) => grid.map((cell) => ({ ...cell }));

const isValidCellIndex = (index, size) =>
  Number.isInteger(index) && index >= 0 && index < size;

const buildGridFromPathfindingResult = (result) => {
  const dims = Number(result?.gridDims);
  const gridSize = Number(result?.gridSize);
  const algorithmRuntimeUs = Number(result?.algorithmRuntimeUs);
  const expectedSize = dims * dims;

  if (!Number.isInteger(dims) || dims < 2) {
    throw new Error("Engine returned an invalid grid dimension.");
  }

  if (!Number.isInteger(gridSize) || gridSize !== expectedSize) {
    throw new Error("Engine returned an invalid grid size.");
  }

  if (!Array.isArray(result?.cells) || result.cells.length !== gridSize) {
    throw new Error("Engine returned an invalid cells array.");
  }

  if (!Number.isFinite(algorithmRuntimeUs) || algorithmRuntimeUs < 0) {
    throw new Error("Engine returned an invalid algorithm runtime.");
  }

  const baseGrid = result.cells.map((state, index) => ({
    id: index,
    state: engineStateToUiState(state),
  }));

  const visitOrder = Array.isArray(result?.visitOrder)
    ? result.visitOrder.filter((index) => isValidCellIndex(index, baseGrid.length))
    : [];
  const path = Array.isArray(result?.path)
    ? result.path.filter((index) => isValidCellIndex(index, baseGrid.length))
    : [];

  return {
    dims,
    baseGrid,
    found: Boolean(result?.found),
    visitOrder,
    path,
    visitCount: visitOrder.length,
    pathCount: path.length,
    runtimeMs: algorithmRuntimeUs / 1000,
  };
};

const buildGridFromGridResult = (result) => {
  const dims = Number(result?.gridDims);
  const gridSize = Number(result?.gridSize);
  const expectedSize = dims * dims;

  if (!Number.isInteger(dims) || dims < 2) {
    throw new Error("Engine returned an invalid grid dimension.");
  }

  if (!Number.isInteger(gridSize) || gridSize !== expectedSize) {
    throw new Error("Engine returned an invalid grid size.");
  }

  if (!Array.isArray(result?.cells) || result.cells.length !== gridSize) {
    throw new Error("Engine returned an invalid cells array.");
  }

  const nextGrid = result.cells.map((state, index) => ({
    id: index,
    state: engineStateToUiState(state),
  }));

  return { dims, grid: nextGrid };
};

function App() {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [grid, setGrid] = useState(() => createPlaceholderGrid(DEFAULT_GRID_SIZE));
  const [engineBaseGrid, setEngineBaseGrid] = useState(null);
  const [serverStatus, setServerStatus] = useState("Checking...");
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [activeAlgorithm, setActiveAlgorithm] = useState(null);
  const [algorithmStats, setAlgorithmStats] = useState(INITIAL_ALGORITHM_STATS);
  const animationRef = useRef({ frameId: null, resolve: null });

  const cancelGridAnimation = () => {
    if (animationRef.current.frameId !== null) {
      cancelAnimationFrame(animationRef.current.frameId);
      animationRef.current.frameId = null;
    }

    if (animationRef.current.resolve) {
      const resolve = animationRef.current.resolve;
      animationRef.current.resolve = null;
      resolve();
    }
  };

  const animatePathfindingResult = (baseGrid, visitOrder, path) =>
    new Promise((resolve) => {
      cancelGridAnimation();
      animationRef.current.resolve = resolve;

      let visitIndex = 0;
      let pathIndex = 0;
      let nextGrid = cloneGrid(baseGrid);
      const frameDurationMs = 1000 / 60;
      let lastFrameTime = 0;
      const targetAnimationMs = 0;
      const targetFrames = Math.max(1, Math.round(targetAnimationMs / frameDurationMs));
      const totalNodes = visitOrder.length + path.length;
      const nodesPerFrame = Math.max(1, Math.ceil(totalNodes / targetFrames));
      setGrid(nextGrid);

      const applyNodeState = (cells, index, nextState) => {
        if (!isValidCellIndex(index, cells.length)) return false;

        const cell = cells[index];
        if (!cell || cell.state === "start" || cell.state === "end") return false;
        if (cell.state === nextState) return false;

        cells[index] = { ...cell, state: nextState };
        return true;
      };

      const step = (timestamp) => {
        if (timestamp - lastFrameTime < frameDurationMs) {
          animationRef.current.frameId = requestAnimationFrame(step);
          return;
        }
        lastFrameTime = timestamp;

        let remainingInFrame = nodesPerFrame;
        const updated = nextGrid.slice();
        let changed = false;

        while (remainingInFrame > 0) {
          if (visitIndex < visitOrder.length) {
            changed = applyNodeState(updated, visitOrder[visitIndex], "visited") || changed;
            visitIndex += 1;
            remainingInFrame -= 1;
            continue;
          }

          if (pathIndex < path.length) {
            changed = applyNodeState(updated, path[pathIndex], "path") || changed;
            pathIndex += 1;
            remainingInFrame -= 1;
            continue;
          }

          break;
        }

        if (changed) {
          nextGrid = updated;
          setGrid(nextGrid);
        }

        if (visitIndex < visitOrder.length || pathIndex < path.length) {
          animationRef.current.frameId = requestAnimationFrame(step);
          return;
        }

        animationRef.current.frameId = null;
        const done = animationRef.current.resolve;
        animationRef.current.resolve = null;
        done?.();
      };

      animationRef.current.frameId = requestAnimationFrame(step);
    });

  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        const [healthResponse, configResponse, gridResponse] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/config"),
          fetch("/api/grid"),
        ]);

        if (!healthResponse.ok || !configResponse.ok || !gridResponse.ok) {
          throw new Error("API returned an error response.");
        }

        const health = await healthResponse.json();
        const configPayload = await configResponse.json();
        const gridPayload = await gridResponse.json();
        const size = Number(configPayload?.config?.grid_size);

        if (Number.isInteger(size) && size >= 2) {
          setGridSize(size);
        }

        if (gridPayload?.ok && gridPayload?.result) {
          const nextState = buildGridFromGridResult(gridPayload.result);
          setGridSize(nextState.dims);
          setGrid(nextState.grid);
          setEngineBaseGrid(cloneGrid(nextState.grid));
        } else if (Number.isInteger(size) && size >= 2) {
          setGrid(createPlaceholderGrid(size));
        }

        setServerStatus(`Online (${health.service})`);
      } catch (_error) {
        setServerStatus("Offline: start the API server on port 3001");
      }
    };

    fetchServerStatus();

    return () => {
      cancelGridAnimation();
    };
  }, []);

  const updateAlgorithmStats = (algorithmKey, nextMetrics) => {
    setAlgorithmStats((prevStats) => ({
      ...prevStats,
      [algorithmKey]: {
        runtimeMs: nextMetrics.runtimeMs,
        visitedCells: nextMetrics.visitedCells,
        pathLength: nextMetrics.pathLength,
      },
    }));
  };

  const runPathfindingAlgorithm = async (algorithmKey, algorithmLabel, endpoint) => {
    setIsRunning(true);
    setActiveAlgorithm(algorithmKey);
    setRunStatus(`Running ${algorithmLabel}`);

    try {
      const response = await fetch(endpoint, { method: "POST" });
      const payload = await response.json();

      if (!response.ok || !payload?.ok || !payload?.result) {
        throw new Error(payload?.details ?? payload?.error ?? `${algorithmLabel} request failed.`);
      }

      const nextState = buildGridFromPathfindingResult(payload.result);
      setGridSize(nextState.dims);
      setEngineBaseGrid(nextState.baseGrid);
      setRunStatus(`Animating ${algorithmLabel}`);
      await animatePathfindingResult(nextState.baseGrid, nextState.visitOrder, nextState.path);
      updateAlgorithmStats(algorithmKey, {
        runtimeMs: nextState.runtimeMs,
        visitedCells: nextState.visitCount,
        pathLength: nextState.pathCount,
      });
      setRunStatus(
        nextState.found
          ? `${algorithmLabel} complete, path found`
          : `${algorithmLabel} complete, path not found`,
      );
    } catch (_error) {
      setRunStatus("Failed");
    } finally {
      setIsRunning(false);
      setActiveAlgorithm(null);
    }
  };

  const runBfs = () => runPathfindingAlgorithm("bfs", "BFS", "/api/algorithms/bfs");
  const runAstar = () => runPathfindingAlgorithm("astar", "A*", "/api/algorithms/astar");
  const runDijkstra = () =>
    runPathfindingAlgorithm("dijkstra", "Dijkstra", "/api/algorithms/dijkstra");

  const resetGrid = async () => {
    setIsRunning(true);
    setRunStatus("Clearing");

    try {
      cancelGridAnimation();
      const response = await fetch("/api/grid/clear", { method: "POST" });
      const payload = await response.json();

      if (!response.ok || !payload?.ok || !payload?.result) {
        throw new Error(payload?.details ?? payload?.error ?? "Clear request failed.");
      }

      const nextState = buildGridFromGridResult(payload.result);
      setGridSize(nextState.dims);
      setGrid(nextState.grid);
      setEngineBaseGrid(cloneGrid(nextState.grid));
      setRunStatus("Idle");
    } catch (_error) {
      setRunStatus("Failed");
    } finally {
      setIsRunning(false);
    }
  };

  const generateMaze = async () => {
    setIsRunning(true);
    setRunStatus("Generating maze");

    try {
      cancelGridAnimation();
      const response = await fetch("/api/algorithms/maze", { method: "POST" });
      const payload = await response.json();

      if (!response.ok || !payload?.ok || !payload?.result) {
        throw new Error(payload?.details ?? payload?.error ?? "Maze request failed.");
      }

      const nextState = buildGridFromGridResult(payload.result);
      setGridSize(nextState.dims);
      setGrid(nextState.grid);
      setEngineBaseGrid(cloneGrid(nextState.grid));
      setRunStatus("Maze generated");
    } catch (_error) {
      setRunStatus("Failed");
    } finally {
      setIsRunning(false);
    }
  };

  const tableRows = [
    { key: "bfs", label: "BFS" },
    { key: "dijkstra", label: "Dijkstra" },
    { key: "astar", label: "A*" },
  ];

  return (
    <main className="page">
      <header className="topbar">
        <h1>Pathfinding Visualizer</h1>
        <p className="status">{serverStatus}</p>
      </header>

      <section className="panel">
        <p>Grid: {gridSize} x {gridSize}</p>
        <div className="panel-actions">
          <button onClick={runBfs} disabled={isRunning}>
            {isRunning && activeAlgorithm === "bfs" ? "Running..." : "Run BFS"}
          </button>
          <button onClick={runDijkstra} disabled={isRunning}>
            {isRunning && activeAlgorithm === "dijkstra" ? "Running..." : "Run Dijkstra"}
          </button>
          <button onClick={runAstar} disabled={isRunning}>
            {isRunning && activeAlgorithm === "astar" ? "Running..." : "Run A*"}
          </button>
          <button onClick={resetGrid} disabled={isRunning || !engineBaseGrid}>Clear Grid</button>
          <button onClick={generateMaze} disabled={isRunning}>Generate Maze</button>
        </div>
      </section>

      <section className="content-layout">
        <section
          className="grid"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
          {grid.map((cell) => (
            <button
              key={cell.id}
              className={`cell ${cell.state}`}
              aria-label={`Cell ${cell.id}`}
            />
          ))}
        </section>

        <aside className="metrics-panel">
          <h2>Algorithm Performance</h2>
          <table className="metrics-table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Algorithm Runtime</th>
                <th>Visited Cells</th>
                <th>Path Length</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => {
                const metrics = algorithmStats[row.key];
                return (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td>
                      {typeof metrics.runtimeMs === "number"
                        ? `${metrics.runtimeMs.toFixed(2)} ms`
                        : EMPTY_METRIC}
                    </td>
                    <td>
                      {typeof metrics.visitedCells === "number"
                        ? metrics.visitedCells
                        : EMPTY_METRIC}
                    </td>
                    <td>
                      {typeof metrics.pathLength === "number"
                        ? metrics.pathLength
                        : EMPTY_METRIC}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="run-status">Run Status: {runStatus}</p>
        </aside>
      </section>
    </main>
  );
}

export default App;
