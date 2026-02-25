import { useEffect, useMemo, useState } from "react";
import "./App.css";

const DEFAULT_GRID_SIZE = 20;

const createGrid = (size) =>
  Array.from({ length: size * size }, (_, index) => ({
    id: index,
    state: "empty",
  }));

function App() {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [grid, setGrid] = useState(() => createGrid(DEFAULT_GRID_SIZE));
  const [serverStatus, setServerStatus] = useState("Checking...");

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

  const wallCount = useMemo(
    () => grid.filter((cell) => cell.state === "wall").length,
    [grid],
  );

  return (
    <main className="page">
      <header className="topbar">
        <h1>Pathfinding Visualizer</h1>
        <p className="status">{serverStatus}</p>
      </header>

      <section className="panel">
        <p>Grid: {gridSize} x {gridSize}</p>
        <button onClick={() => setGrid(createGrid(gridSize))}>Clear Grid</button>
      </section>

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
    </main>
  );
}

export default App;
