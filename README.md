Pathfinding Visualizer (Pygame)

This is a simple pathfinding visualizer built with Pygame. It uses a grid and runs BFS to show the shortest path between two points.

Things that can be improved:

- Add more algorithms: A*, Dijkstra, Greedy Best First, Bidirectional BFS.
- Add weighted terrains (cells with different movement cost).
- Option to switch between 4-direction and 8-direction movement (for dijkstra).
- Add path smoothing after finding the path.
- Show counters: nodes visited, path length, total cost, elapsed time.
- Add different maze generators: recursive backtracker, Prim’s, Kruskal’s, recursive division, Hunt-and-Kill.
- Split code into clearer parts: grid/algorithms, drawing, input handling.

Good next steps:
1. Add A* for shortest path with weights.
2. Add recursive backtracker maze generation.
3. Add a status bar with nodes expanded, path cost, and time.

Notes:
- BFS is fine for 4-direction grids with equal step cost.
- For weighted or diagonal movement, switch to Dijkstra or A*.
- Keep functions small to make the main loops clear.
