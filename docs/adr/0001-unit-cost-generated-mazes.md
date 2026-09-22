# Use bounded weighted generated mazes for algorithm comparison

## Status

Accepted

## Context

Perfect mazes provide exactly one route between any two passages, so A* cannot use its heuristic to eliminate meaningful alternatives. Unbounded random per-cell traversal weights weaken an admissible Manhattan heuristic because its lower bound must use the smallest possible step cost.

## Decision

Generate connected mazes with deterministic interior wall openings. Assign ordinary passages a traversal weight of `3` and occasional rough-terrain passages a weight of `6`. BFS therefore finds the fewest-step route, while Dijkstra and A* optimize weighted travel cost. A* scales Manhattan distance by the minimum traversal cost and prefers candidates that have made more progress when estimated costs tie.

## Consequences

Generated mazes retain a closed perimeter and deterministic seed behavior while offering alternate routes. A* visibly explores fewer cells than BFS on high-density Grids, while Dijkstra and A* can select a different, lower-cost route than BFS. The bounded range keeps A*'s admissible heuristic informative.
