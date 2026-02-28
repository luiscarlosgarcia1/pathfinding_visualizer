import { useEffect, useState } from "react";
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

const createGrid = (size) => {
  const nextGrid = Array.from({ length: size * size }, (_, index) => ({
    id: index,
    state: "empty",
  }));

  if (nextGrid.length > 0) {
    nextGrid[0] = { id: 0, state: "start" };
    nextGrid[nextGrid.length - 1] = { id: nextGrid.length - 1, state: "end" };
  }

  return nextGrid;
};

const isValidCellIndex = (index, size) =>
  Number.isInteger(index) && index >= 0 && index < size;

const buildGridFromBfsResult = (result) => {
  const dims = Number(result?.gridDims);
  const gridSize = Number(result?.gridSize);
  const expectedSize = dims * dims;

  if (!Number.isInteger(dims) || dims < 2) {
    throw new Error("Engine returned an invalid grid dimension.");
  }

  if (!Number.isInteger(gridSize) || gridSize !== expectedSize) {
    throw new Error("Engine returned an invalid grid size.");
  }

  const baseGrid =
    Array.isArray(result?.cells) && result.cells.length === gridSize
      ? result.cells.map((state, index) => ({
          id: index,
          state: engineStateToUiState(state),
        }))
      : createGrid(dims);

  const visitOrder = Array.isArray(result?.visitOrder) ? result.visitOrder : [];
  const path = Array.isArray(result?.path) ? result.path : [];

  for (const index of visitOrder) {
    if (!isValidCellIndex(index, baseGrid.length)) continue;
    if (baseGrid[index].state === "start" || baseGrid[index].state === "end") continue;
    baseGrid[index] = { ...baseGrid[index], state: "visited" };
  }

  for (const index of path) {
    if (!isValidCellIndex(index, baseGrid.length)) continue;
    if (baseGrid[index].state === "start" || baseGrid[index].state === "end") continue;
    baseGrid[index] = { ...baseGrid[index], state: "path" };
  }

  return {
    dims,
    grid: baseGrid,
    found: Boolean(result?.found),
    visitCount: visitOrder.length,
    pathCount: path.length,
  };
};

function App() {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [grid, setGrid] = useState(() => createGrid(DEFAULT_GRID_SIZE));
  const [serverStatus, setServerStatus] = useState("Checking...");
  const [runStatus, setRunStatus] = useState("Idle");
  const [isRunning, setIsRunning] = useState(false);
  const [algorithmStats, setAlgorithmStats] = useState(INITIAL_ALGORITHM_STATS);

  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        const [healthResponse, configResponse] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/config"),
        ]);

        if (!healthResponse.ok || !configResponse.ok) {
          throw new Error("API returned an error response.");
        }

        const health = await healthResponse.json();
        const configPayload = await configResponse.json();
        const size = Number(configPayload?.config?.grid_size);

        if (Number.isInteger(size) && size >= 2) {
          setGridSize(size);
          setGrid(createGrid(size));
        }

        setServerStatus(`Online (${health.service})`);
      } catch (_error) {
        setServerStatus("Offline: start the API server on port 3001");
      }
    };

    fetchServerStatus();
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

  const runBfs = async () => {
    const startTime = performance.now();
    setIsRunning(true);
    setRunStatus("Running");

    try {
      const response = await fetch("/api/algorithms/bfs", { method: "POST" });
      const payload = await response.json();

      if (!response.ok || !payload?.ok || !payload?.result) {
        throw new Error(payload?.details ?? payload?.error ?? "BFS request failed.");
      }

      const nextState = buildGridFromBfsResult(payload.result);
      const runtimeMs = performance.now() - startTime;
      setGridSize(nextState.dims);
      setGrid(nextState.grid);
      updateAlgorithmStats("bfs", {
        runtimeMs,
        visitedCells: nextState.visitCount,
        pathLength: nextState.pathCount,
      });
      setRunStatus(nextState.found ? "Complete, path found" : "Complete, path not found");
    } catch (error) {
      setRunStatus("Failed");
    } finally {
      setIsRunning(false);
    }
  };

  const resetGrid = () => {
    setGrid(createGrid(gridSize));
    setRunStatus("Idle");
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
            {isRunning ? "Running..." : "Run BFS"}
          </button>
          <button onClick={resetGrid} disabled={isRunning}>Reset Grid</button>
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
                <th>Total Runtime</th>
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
