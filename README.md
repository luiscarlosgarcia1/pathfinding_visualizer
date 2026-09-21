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
- `configs/config.json`: user-configurable grid size.
- `schemas/app_config.schema.json`: JSON schema for the on-disk configuration only.

## Features Implemented So Far

- BFS, Dijkstra, and A* pathfinding in the C++ engine.
- Weighted path cost support for Dijkstra and A* (`stepCost = max(1, cellWeight)`).
- Path total distance metric emitted by all algorithms.
- Wilson's perfect-maze generation, with a solid outer wall and generated routes connecting the interior Start and End cells.
- Per-cell weight generation during maze carving.
- Config-driven grid dimensions (`grid_size` in `configs/config.json`).
- Version-2 binary `Layout` and `Pathfinding run` envelopes. The server is the canonical owner of the Current maze layout, so all algorithm runs compare the same Base grid.
- API endpoints for health, configuration, `GET`/`POST /api/layout`, and `POST /api/runs/:algorithm`.
- BFS, Dijkstra, and A* runs with `full` (visit order and final path) or `metrics` detail tiers.
- React presentations tuned to grid density: an accessible DOM grid for ordinary sizes, and an adaptive Canvas presentation with an equivalent text summary and metrics for high density.

## Design Choices

- **C++ engine for algorithms**: pathfinding/maze logic runs in native code for performance and clear algorithm isolation.
- **Binary envelope contract**: engine/API exchange fixed headers plus compact typed cell data. Layouts encode each cell's role and weight; full runs encode index arrays only for the traversal and final path. This avoids JSON serialization and client-side reconstruction of legacy sparse schemas.
- **Hybrid weighted model**:
  - BFS remains unweighted for traversal behavior.
  - Dijkstra and A* optimize weighted path cost using per-cell weights with a minimum step cost of `1`.
- **Node/Express orchestration layer**: server manages process execution, timeout handling, layout seed state, Base-grid caching, and binary-envelope validation.
- **Adaptive visualization**: at ordinary density, individual cells remain inspectable through the DOM grid. At high density, rendering every cell as an interactive DOM control obscures the lesson and harms responsiveness, so Canvas conveys the maze and final path while metrics and the text alternative preserve comparison and accessibility outcomes.
- **CLI-style engine contract**: engine writes binary envelopes to standard output, keeping the native/HTTP boundary compact and explicit.
- **Config-first grid sizing**: grid dimensions come from `configs/config.json`, with fallback logic in `grid_size_reader.cpp`.

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
