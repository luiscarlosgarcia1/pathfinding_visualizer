# Benchmarking Methodology

## Purpose
This document defines how pathfinding algorithms are benchmarked within this project.  
The goal of benchmarking is to **empirically evaluate algorithm behavior**, not to claim absolute performance superiority.

Benchmarks are designed to be:
- Reproducible
- Fair across algorithms
- Interpretable
- Comparable across configurations

---

## Benchmark Scope

Benchmarks evaluate the following algorithms:
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra’s Algorithm
- A* Search

All benchmarks are executed using the **C++ pathfinding engine** to minimize runtime overhead and isolate algorithmic performance.

---

## Test Environment Assumptions

- Single-threaded execution
- No GPU acceleration
- Identical grid inputs across all algorithms
- Same compiler and optimization settings per run
- Benchmarks executed on the same machine for direct comparison

Absolute timing values are considered **machine-dependent**.  
Relative comparisons between algorithms are the primary focus.

---

## Grid Configuration

Each benchmark run operates on a grid defined by:
- Width × height
- Obstacle density (percentage of blocked cells)
- Fixed start and goal positions

Grid configurations are either:
- Generated deterministically (seeded RNG), or
- Loaded from predefined map files

This ensures consistency across runs.

---

## Metrics Collected

Each benchmark records the following metrics:

### Runtime
- Wall-clock execution time
- Measured in milliseconds
- Excludes I/O and visualization overhead

### Nodes Expanded
- Number of unique nodes removed from the frontier
- Serves as a proxy for search effort

### Path Length
- Length of the final path from start to goal
- Used to verify optimality guarantees

### Success Flag
- Indicates whether a path was found

---

## Measurement Strategy

- Each algorithm is run multiple times per grid configuration
- Results are aggregated to reduce noise
- Mean values are reported
- Outliers are noted but not discarded without justification

No algorithm is given early termination advantages.

---

## Output Format

Benchmark results are written to disk as **JSON files** following a fixed schema.

Each result includes:
- Algorithm name
- Grid configuration
- Metrics collected
- Execution metadata (timestamp, run ID)

JSON is treated as a **contract** between:
- C++ engine
- Benchmark runner
- Web-based analysis dashboard

---

## Reproducibility

Benchmarks are reproducible by:
- Using deterministic grid generation
- Version-controlling benchmark configurations
- Running benchmarks via scripted CLI commands
- Optionally using Docker to standardize environments

Instructions for reproducing benchmarks are documented separately.

---

## Interpretation Guidelines

When analyzing results:
- Lower runtime does not automatically imply better algorithm
- Node expansion provides insight into search efficiency
- Optimality must be verified via path length
- Performance should be interpreted relative to problem constraints

Benchmarks are intended to illustrate **tradeoffs**, not absolutes.

---

## Limitations

- Results do not reflect real-time or dynamic environments
- Memory usage is not currently measured
- Cache effects and CPU microarchitecture are not controlled
- DFS results are included for contrast, not optimality

These limitations are accepted to maintain focus on algorithmic behavior.

---

## Future Extensions

- Memory usage tracking
- Larger-scale grids
- Heuristic sensitivity analysis
- Statistical confidence intervals
- CSV export for external analysis

All extensions must preserve benchmark fairness and reproducibility.
