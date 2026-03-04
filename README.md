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

- BFS pathfinding in the C++ engine.
- Prim's maze generation in the C++ engine.
- Config-driven grid dimensions (`grid_size` in `configs/config.json`).
- Engine modes for `empty`, `maze`, `bfs-empty`, and `bfs-maze`.
- Express API endpoints for health, config, base grid, maze generation, BFS, and clear.
- React visualization of:
  - grid cells (`empty`, `wall`, `start`, `end`, `visited`, `path`)
  - run status
  - BFS performance metrics (runtime, visited cells, path length)
- Deterministic maze/BFS runs per generated maze seed while the current maze layout is active.

## Design Choices

- **C++ engine for algorithms**: pathfinding/maze logic runs in native code for performance and clear algorithm isolation.
- **Node/Express orchestration layer**: server manages process execution, timeouts, API responses, and error handling.
- **React frontend for visualization**: UI focuses on rendering grid state and algorithm metrics.
- **CLI-style engine contract**: engine prints JSON to stdout, making integration simple across server/frontend layers.
- **Config-first grid sizing**: grid dimensions come from `configs/config.json`, with fallback logic in `grid_size_reader.cpp`.

## Future Plan

- Implement Dijkstra in the C++ engine.
- Add a Dijkstra API route and wire it into the frontend controls + metrics table.
- Implement A* in the C++ engine.
- Add an A* API route and wire it into the frontend controls + metrics table.

## Known Bugs

- If `grid_size` is changed by the user in `configs/config.json`, or if maze origin is changed away from `gridSize / 2` inside Prim's maze generation, start/end nodes can become surrounded by walls.
- During maze generation, any two sides of the grid can sometimes end up as solid wall lines.

## Troubleshooting

- `engine binary not found` from API:
  - Rebuild with `make` and confirm `cpp-engine/build/main` exists.
- Frontend cannot reach API:
  - Confirm server is running on port `3001`.
  - Confirm Vite dev server is running and proxying `/api` requests.

## Disclaimer

This is a learning-oriented project focused on understanding and implementing pathfinding and maze algorithms.
The web API and UI were built with assistance from OpenAI Codex under my guidance.
While I wanted exposure to React, the primary goal of this project is visual, interactive algorithm implementation.
