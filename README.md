Pathfinding Visualizer (Pygame)

This is a simple pathfinding visualizer built with Pygame. It uses a grid and runs BFS to show the shortest path between two points.

Things to improve:

- Add more algorithms: A*, Dijkstra, Greedy Best First, Bidirectional BFS.
- Add weighted terrains (cells with different movement cost).
- Option to switch between 4-direction and 8-direction movement (for dijkstra).
- Add path smoothing after finding the path.
- Show counters: nodes visited, path length, total cost, elapsed time.
- Add different maze generators: recursive backtracker, Prim’s, Kruskal’s, recursive division, Hunt-and-Kill.
- Split code into clearer parts: grid/algorithms, drawing, input handling.
- Add a status bar with nodes expanded, path cost, and time.

Notes:
- **Perlin noise function for maze generation adapted with AI assistance**
- BFS is fine for 4-direction grids with equal step cost.
- For weighted or diagonal movement, switch to Dijkstra or A*.
- Keep functions small to make the main loops clear.
