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
- `schemas/bfs_response.schema.json`
  - JSON schema for BFS output payload.
- `web/`
  - Default React + Vite starter project, not yet connected to the engine.

## BFS I/O Contract
Use this contract between frontend, server, and C++ engine when running BFS.

### Request
- No request payload is required right now.
- The engine reads grid size from `configs/config.json`.
- `start` and `end` are fixed in engine (`start = 0`, `end = gridSize - 1`).

### Response (`BfsResponse`)
```json
{
  "gridDims": 30,
  "gridSize": 900,
  "cells": ["Start", "Empty", "Wall", "..."],
  "found": true,
  "visitOrder": [1, 30, 2],
  "path": [31, 61, 91]
}
```

- `cells` mirrors the engine's grid state.
- `visitOrder` is BFS exploration order (excluding start/end handling per engine logic).
- `path` is ordered from first step after start to last step before end.

## Next Steps
- Add core pathfinding logic to the C++ engine (BFS, then A*/Dijkstra).
- Define a clean interface between engine state and frontend rendering.
- Replace the starter React UI with the actual visualizer controls/canvas.
