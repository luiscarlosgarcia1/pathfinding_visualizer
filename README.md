Pathfinding Visualizer (Pygame)

This is a simple pathfinding visualizer built with Pygame. It uses a grid, lets you place start, end, and walls, and runs BFS to show the shortest path.

Things that can be improved:

- Add more algorithms: A*, Dijkstra, Greedy Best First, Bidirectional BFS.
- Add weighted terrains (cells with different movement cost).
- Allow interactive weights (painting areas with higher movement cost).
- Option to switch between 4-direction and 8-direction movement.
- Add path smoothing after finding the path.
- Add animation controls: speed slider, pause and step-through mode.
- Add better colors and maybe fades for visited/path cells.
- Show counters: nodes visited, path length, total cost, elapsed time.
- Build a simple UI/toolbar with buttons instead of only keyboard shortcuts.
- Add a legend and key hints on screen.
- Add different maze generators: recursive backtracker, Prim’s, Kruskal’s, recursive division, Hunt-and-Kill.
- Add save/load feature for grids (JSON).
- Split code into clearer parts: grid/algorithms, drawing, input handling.
- Support multiple goals, multiple start points, checkpoints, or waypoints.
- Make start and end draggable with live path updates.

Good next steps:
1. Add speed slider and pause/step mode.
2. Add A* for shortest path with weights.
3. Add recursive backtracker maze generation.
4. Add a status bar with nodes expanded, path cost, and time.
5. Add save/load grids to JSON.

Notes:
- BFS is fine for 4-direction grids with equal step cost.
- For weighted or diagonal movement, switch to Dijkstra or A*.
- Keep functions small to make the main loops clear.
