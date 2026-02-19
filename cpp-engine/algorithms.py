import grid as grid_module
from collections import deque
import heapq
import math
import itertools

def clean_neighbors(nbrs):
    for i in range(len(nbrs)):
        if nbrs[i] is None or nbrs[i].iswall:
            nbrs[i] = None
    return nbrs

def bfs_has_path(grid, start, end):
    from collections import deque
    queue = deque([start])
    visited = set([start])

    while queue:
        cell = queue.popleft()
        if cell is end:
            return True
        for n in grid_module.neighbors(grid, cell):
            if n and not n.iswall and n not in visited:
                visited.add(n)
                queue.append(n)
    return False

def run_bfs(grid, start, end, draw_step):
    queue = deque([start])
    visited = set([start])
    parent = {}

    while len(queue) > 0:
        cell = queue.popleft()

        if cell is end:
            break

        if cell is not start and cell is not end and cell.color != grid_module.LIGHT_GREY:
            cell.color = grid_module.BLUE
            draw_step()

        nbrs = clean_neighbors(grid_module.neighbors(grid, cell))

        for neighbor in nbrs:
            if neighbor is not None and neighbor not in visited:
                queue.append(neighbor)
                visited.add(neighbor)
                parent[neighbor] = cell

    path = []
    curr = end
    while curr is not start: 
        if curr not in parent:
            return path
        curr = parent[curr]
        if curr is not start:
            path.insert(0, curr)
    
    for i in path:
        i.color = grid_module.ORANGE
        draw_step()