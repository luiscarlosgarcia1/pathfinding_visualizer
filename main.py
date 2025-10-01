import sys
import pygame
import random
import grid as grid_module
import algorithms as algos

pygame.init()

WIN = pygame.display.set_mode((grid_module.WIDTH, grid_module.HEIGHT))
pygame.display.set_caption("Pathfinding Visualizer")

grid = grid_module.make_grid()
start = None
end = None

alg_idx = 0
ALGORITHMS = [
    ("BFS", algos.run_bfs, algos.bfs_has_path)
]

def place_start_end():
    sr, sc = 1, 1
    er, ec = grid_module.ROWS - 2, grid_module.COLS - 2
    s = grid[sr][sc]
    e = grid[er][ec]
    s.make_start()
    e.make_end()

    return s, e

def reset_grid():
    global grid, start, end

    while True:
        grid = grid_module.make_grid()

        grid_module.apply_perlin_walls(grid, scale=3.0, threshold=0.56, seed=random.randint(0, 999999))

        start, end = place_start_end()

        if ALGORITHMS[alg_idx][2](grid, start, end):
            break

    pygame.event.pump()
    draw_window()

def rerun_cur():
    name, fn, path_check = ALGORITHMS[alg_idx]
    pygame.display.set_caption(f"Pathfinding Visualizer - {name}")
    reset_grid()
    fn(grid, start, end, draw_step)

def draw_window():
    WIN.fill(grid_module.BLACK)
    grid_module.draw_grid(WIN, grid)
    pygame.display.update()

def draw_step(delay=1):
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            raise SystemExit
    draw_window()
    pygame.time.delay(delay)

run = True
clock = pygame.time.Clock()

rerun_cur()
while run:
    clock.tick(120)

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            run = False

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r:
                rerun_cur()
            elif event.key == pygame.K_SPACE:
                alg_idx += 1
                if alg_idx >= len(ALGORITHMS):
                    pygame.quit()
                    sys.exit()
                rerun_cur()

    draw_window()

pygame.quit()
