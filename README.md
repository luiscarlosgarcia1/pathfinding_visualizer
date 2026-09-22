# Pathfinding Visualizer

## Requirements

- Node.js 18+ (recommended)
- npm
- `g++` with C++17 support
- `make`

Example install on macOS (Homebrew):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew --version
brew install node gcc make
node -v
npm -v
g++ --version
make --version
```

## Run Locally

1. Clone the repository and move into it.
2. Install dependencies for root, server, and web.
3. Build the C++ engine binary.
4. Start server + frontend together.
5. Open the frontend URL printed by Vite (usually `http://localhost:5173`).

```bash
git clone <repo-url>
cd pathfinding_visualizer

npm install
npm --prefix server install
npm --prefix web install

make
npm run dev
```

## Project Structure

- `cpp-engine/`: C++ pathfinding and maze generation engine.
- `server/`: Express API that owns the current maze layout and serves binary envelopes.
- `web/`: React + Vite frontend.

## Features Implemented So Far

- BFS, Dijkstra, and A* pathfinding in the C++ engine.
- Weighted path cost support for Dijkstra and A* (`stepCost = max(1, cellWeight)`).
- Path total distance metric emitted by all algorithms.
- Wilson-based maze generation with deterministic interior wall openings, a solid outer wall, and generated routes connecting the interior Start and End cells.
- Bounded per-cell traversal costs: most passages cost 3 and occasional rough-terrain passages cost 6.
- A fixed 101×101 Grid across the engine, API, and client.
- Version-2 binary `Layout` and `Pathfinding run` envelopes. The server is the canonical owner of the Current maze layout, so all algorithm runs compare the same Base grid.
- API endpoints for health, `GET`/`POST /api/layout`, and `POST /api/runs/:algorithm`.
- BFS, Dijkstra, and A* runs with `full` (visit order and final path) or `metrics` detail tiers.
- A Canvas-only React visualization with an equivalent text summary and comparable metrics.

## Design Choices

- **C++ engine for algorithms**: pathfinding/maze logic runs in native code for performance and clear algorithm isolation.
- **Binary envelope contract**: engine/API exchange fixed headers plus compact typed cell data. Layouts encode each cell's role and weight; full runs encode index arrays only for the traversal and final path. This avoids JSON serialization and client-side reconstruction of legacy sparse schemas.
- **Bounded weighted comparison model**:
  - BFS uses FIFO traversal to find the shortest path in steps.
  - Dijkstra and A* optimize traversal cost over predominantly cost-3 terrain with occasional cost-6 rough terrain.
  - A* scales its Manhattan lower bound by the minimum traversal cost to reduce its search space without compromising optimality.
- **Node/Express orchestration layer**: server manages process execution, timeout handling, layout seed state, Base-grid caching, and binary-envelope validation.
- **Canvas visualization**: the fixed 101×101 Grid is rendered on Canvas, avoiding thousands of individual DOM cells while the text summary and metrics preserve comparison and accessibility outcomes.
- **CLI-style engine contract**: engine writes binary envelopes to standard output, keeping the native/HTTP boundary compact and explicit.
- **Fixed Grid sizing**: the Grid dimension is a single engine constant fixed at 101, and API/client validation rejects any other shape.

## Troubleshooting

- `engine binary not found` from API:
  - Rebuild with `make` and confirm `cpp-engine/build/main` exists.
- Frontend cannot reach API:
  - Confirm server is running on port `3001`.
  - Confirm Vite dev server is running and proxying `/api` requests.

## Verification

The modernization acceptance record, including supported-browser checks and the benchmark procedure, is in [docs/verification/t72-modernization.md](docs/verification/t72-modernization.md).

## Disclaimer

This is a learning-oriented project focused on understanding and implementing pathfinding and maze algorithms.
The web API and UI were built with assistance from OpenAI Codex under my guidance.
While I wanted exposure to React, the primary goal of this project is interactive algorithm implementation.
