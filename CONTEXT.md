# Pathfinding Visualizer glossary

## Pathfinding Visualizer

An interactive web application that generates a bounded weighted maze and compares BFS, Dijkstra, and A* traversal across the same maze layout. It consists of a native C++ engine, an Express API server, and a React/Vite visualization client.

## Grid

A square, row-major collection of cells. Its dimension is `gridDims`; its total cell count is `gridSize`, which must equal `gridDims * gridDims`. The configured `grid_size` controls the grid dimension.

## Cell index

The integer, zero-based row-major position of a cell in the Grid. Engine, API, and client contracts exchange cells through indexes rather than coordinate objects.

## Base grid

The generated maze layout for the current maze seed, including Wall, Start, End, and per-cell weights. The server caches it so all algorithms run against the same layout.

## Current maze layout

The server-owned maze seed and its corresponding Base grid. Generating a new maze replaces this layout; running a pathfinding algorithm must not.

## Maze seed

The integer seed passed to the C++ engine before Wilson's maze generation. Reusing it produces a deterministic maze and deterministic pathfinding input while the current layout remains active.

## Grid cell states

The visual and serialized roles assigned to cells: Empty, Wall, Start, End, Visited, and Path. Base grids contain Empty, Wall, Start, and End; Visited and Path are client-side visualization overlays from a pathfinding result.

## Weight

A numeric traversal value attached to a Grid cell during maze carving. Generated Base grids use cost 3 for ordinary passages and cost 6 for occasional rough terrain. Dijkstra and A* optimize weighted travel cost using `max(1, cellWeight)` as the step cost, while BFS remains unweighted.

## Pathfinding run

One execution of BFS, Dijkstra, or A* against the Current maze layout. It reports whether a path was found, its visit order, final path, engine runtime, and total distance.

## Sparse payload

The engine/API representation that sends integer index arrays for Wall, Start, End, `visitOrder`, and `path` rather than a full state value for every cell. The React client reconstructs its Grid state from these arrays and the weights array.

## Engine

The C++ executable at `cpp-engine/build/main`. It accepts CLI modes, generates mazes, runs algorithms, and writes JSON to standard output.

## API normalization

The Express server's responsibility to run the Engine, enforce grid-shape and metric invariants, sanitize sparse arrays and weights, cache the Base grid, and expose results through `/api` endpoints.

## Visualization client

The React/Vite application that fetches API results, rebuilds the Grid from Sparse payloads, animates visit order and final paths, and shows per-algorithm metrics.
