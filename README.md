# Pathfinding Visualizer

This repository is currently split into a C++ engine workspace and a React frontend workspace.

## Current Implementation
- `cpp-engine/src/grid.hpp` + `cpp-engine/src/grid.cpp`
  - `grid` class with a `cell` model and `State` enum (`Empty`, `Wall`, `Start`, `End`, `Visited`, `Path`, `Line`).
  - Grid dimensions are loaded from config and used to allocate the full cell vector.
- `cpp-engine/src/config/grid_size_reader.hpp` + `cpp-engine/src/config/grid_size_reader.cpp`
  - Reads `grid_size` from `configs/config.json`.
  - Uses a fallback value of `30` when the file/key/value is invalid.
- `configs/config.json`
  - Current value: `grid_size = 30`.
- `schemas/app_config.schema.json`
  - JSON schema for config validation (`grid_size` must be an integer >= 2).
- `web/`
  - Default React + Vite starter project, not yet connected to the engine.

## Next Steps
- Add core pathfinding logic to the C++ engine (BFS, then A*/Dijkstra).
- Define a clean interface between engine state and frontend rendering.
- Replace the starter React UI with the actual visualizer controls/canvas.
