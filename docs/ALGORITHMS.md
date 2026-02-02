# Pathfinding Algorithms

## Purpose
This document describes the pathfinding algorithms implemented in the project, their theoretical properties, and their practical behavior when applied to grid-based environments.

The goal is not only to implement these algorithms correctly, but to understand:
- Their guarantees
- Their performance tradeoffs
- Their suitability for different problem constraints

All algorithms operate on the same grid abstraction and expose consistent outputs to enable fair comparison.

---

## Common Assumptions

- The environment is modeled as a 2D grid
- Each cell represents a node
- Movement is allowed between adjacent cells (orthogonal by default)
- Obstacles block traversal
- A start node and a goal node are defined

Unless otherwise stated:
- All edges have uniform cost
- Diagonal movement is disabled
- Grids are finite and bounded

---

## Breadth-First Search (BFS)

### Description
Breadth-First Search explores the search space level by level, expanding all nodes at a given distance from the start before moving to the next level.

### Properties
- **Complete**: Yes (if a path exists, BFS will find it)
- **Optimal**: Yes (for unweighted graphs)
- **Deterministic**: Yes (given fixed neighbor ordering)

### Time Complexity
- **O(V + E)**  
For a grid, this simplifies to O(N), where N is the number of cells.

### Space Complexity
- **O(V)**  
Stores visited nodes and the frontier queue.

### Practical Behavior
- Explores large portions of the grid
- Expands many unnecessary nodes
- Guarantees the shortest path in unweighted environments

### When to Use
- Unweighted graphs
- When correctness and optimality are required
- As a baseline for comparison

---

## Depth-First Search (DFS)

### Description
Depth-First Search explores as far as possible along one branch before backtracking.

### Properties
- **Complete**: No (in infinite or cyclic graphs without safeguards)
- **Optimal**: No
- **Deterministic**: Yes (given fixed neighbor ordering)

### Time Complexity
- **O(V + E)**

### Space Complexity
- **O(V)** in the worst case (recursive or explicit stack)

### Practical Behavior
- Quickly dives into paths that may not lead to the goal
- Often finds suboptimal paths
- Explores fewer nodes early but lacks guarantees

### When to Use
- Exploring connectivity
- Generating mazes
- Situations where memory usage is constrained

---

## Dijkstra’s Algorithm

### Description
Dijkstra’s algorithm generalizes BFS to weighted graphs by always expanding the node with the lowest known cost from the start.

### Properties
- **Complete**: Yes
- **Optimal**: Yes (for non-negative edge weights)
- **Deterministic**: Yes

### Time Complexity
- **O((V + E) log V)** with a priority queue

### Space Complexity
- **O(V)**

### Practical Behavior
- Explores nodes in increasing cost order
- Expands fewer nodes than BFS in weighted graphs
- Slower than BFS in unweighted cases due to overhead

### When to Use
- Weighted grids
- When optimal paths are required
- As a reference point for A*

---

## A* Search

### Description
A* is an informed search algorithm that extends Dijkstra’s algorithm by using a heuristic to guide exploration toward the goal.

### Heuristic
The default heuristic is **Manhattan distance**, which is:
- Admissible
- Consistent
- Suitable for grid-based movement without diagonals

### Properties
- **Complete**: Yes
- **Optimal**: Yes (with an admissible heuristic)
- **Deterministic**: Yes

### Time Complexity
- Worst case: **O((V + E) log V)**
- Practical performance is often significantly better than Dijkstra’s

### Space Complexity
- **O(V)**

### Practical Behavior
- Focuses exploration toward the goal
- Expands significantly fewer nodes than BFS or Dijkstra
- Performance depends heavily on heuristic quality

### When to Use
- Large search spaces
- Performance-critical applications
- Situations where near-optimal exploration matters

---

## Algorithm Comparison Summary

| Algorithm | Optimal | Complete | Uses Heuristic | Typical Node Expansion |
|---------|--------|----------|----------------|------------------------|
| BFS     | Yes    | Yes      | No             | High                   |
| DFS     | No     | No       | No             | Low (early)            |
| Dijkstra| Yes    | Yes      | No             | Medium                 |
| A*      | Yes    | Yes      | Yes            | Low                    |

---

## Implementation Notes

- All algorithms share a common grid and node representation
- Frontier structures differ:
  - Queue (BFS)
  - Stack (DFS)
  - Priority queue (Dijkstra, A*)
- Metrics such as runtime and nodes expanded are collected uniformly
- Algorithms are implemented in C++ for performance and benchmarking

---

## Future Extensions

- Diagonal movement
- Variable terrain costs
- Alternative heuristics for A*
- Jump Point Search (JPS)
- Bidirectional search

All extensions must preserve correctness guarantees and interface consistency.
