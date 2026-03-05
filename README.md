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
- `server/`: Express API that runs the engine binary and returns JSON.
- `web/`: React + Vite frontend.
- `configs/config.json`: user-configurable grid size.
- `schemas/`: JSON schemas for config and API payloads.

## Features Implemented So Far

- BFS, Dijkstra, and A* pathfinding in the C++ engine.
- Prim's maze generation in the C++ engine.
- Config-driven grid dimensions (`grid_size` in `configs/config.json`).
- Engine modes for `empty`, `maze`, `pathfind-empty`, and `pathfind-maze`.
- Express API endpoints for health, config, base grid, maze generation, BFS, Dijkstra, A*, and clear.
- Sparse integer serializer/API contract:
  - Base grid returns index arrays for `Wall`, `Start`, and `End`.
  - Pathfinding returns `visitOrder` and `path` index arrays plus runtime/found state.
  - Cells not included in those arrays are treated as empty by the frontend.
- Deterministic maze + pathfinding runs per generated maze seed while the current maze layout is active.
- React visualization for grid state (`empty`, `wall`, `start`, `end`, `visited`, `path`), run status, and per-algorithm metrics (runtime, visited cells, path length).

## Design Choices

- **C++ engine for algorithms**: pathfinding/maze logic runs in native code for performance and clear algorithm isolation.
- **Sparse payload contract**: engine/API communicate with integer index arrays instead of full per-cell state arrays to reduce payload size and serialization overhead.
- **Node/Express orchestration layer**: server manages process execution, timeout handling, layout seed state, base-grid caching, and API normalization.
- **React frontend for visualization**: UI reconstructs view state from sparse payloads and focuses on rendering + animation + metrics.
- **CLI-style engine contract**: engine prints JSON to stdout, keeping integration simple between C++ and JS layers.
- **Config-first grid sizing**: grid dimensions come from `configs/config.json`, with fallback logic in `grid_size_reader.cpp`.

## Future Plan

- Add weighted graph support as the next milestone.
- Add weighted-cell data to the engine model and serializer contract (without regressing current sparse index design).
- Update API + frontend payload handling to include and render weights.
- Add weighted editing controls in the UI (set/remove weights, reset behavior, and clear UX feedback).
- Update Dijkstra/A* to use edge/cell weights and keep BFS behavior explicitly unweighted.
- Add weighted-run metrics (for example total path cost) alongside runtime, visited cells, and path length.

## Known Bugs

- Prim's maze generation is highly sensitive to `grid_size`. If `grid_size` is not in the form `(odd * 10) + 1`, edge walls may fail to generate correctly and start/end nodes can become fully surrounded by walls.

## Troubleshooting

- `engine binary not found` from API:
  - Rebuild with `make` and confirm `cpp-engine/build/main` exists.
- Frontend cannot reach API:
  - Confirm server is running on port `3001`.
  - Confirm Vite dev server is running and proxying `/api` requests.

## Disclaimer

This is a learning-oriented project focused on understanding and implementing pathfinding and maze algorithms.
The web API and UI were built with assistance from OpenAI Codex under my guidance.
While I wanted exposure to React, the primary goal of this project is interactive algorithm implementation.
