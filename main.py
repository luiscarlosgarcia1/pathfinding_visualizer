import pygame
import grid as grid_module
import algorithms as algos

pygame.init()

WIN = pygame.display.set_mode((grid_module.WIDTH, grid_module.HEIGHT))
pygame.display.set_caption("Pathfinding Visualizer")

grid = grid_module.make_grid()
start = None
end = None

def draw_window(WIN, grid):
    WIN.fill(grid_module.WHITE)
    grid_module.draw_grid(WIN, grid)
    pygame.display.update()

def draw_step():        # Add delay later
    draw_window(WIN, grid)

def get_clicked_pos(pos):
    x, y = pos
    col = x // grid_module.CELL_SIZE
    row = y // grid_module.CELL_SIZE
    if 0 <= row < grid_module.ROWS and 0 <= col < grid_module.COLS:
        return row, col
    return None

def left_click(cell):
    global start, end
    if start is None:
        cell.make_start()
        start = cell
    elif end is None and cell != start:
        cell.make_end()
        end = cell
    elif cell != start and cell != end:
        cell.make_wall()

def right_click(cell):
    global start, end
    cell.reset()
    if cell == start:
        start = None
    elif cell == end:
        end = None

run = True
clock = pygame.time.Clock()
left_down = False
right_down = False

while run:
    clock.tick(144)

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            run = False

        if event.type == pygame.MOUSEBUTTONDOWN:
            pos = pygame.mouse.get_pos()
            rc = get_clicked_pos(pos) 

            if rc is not None:
                r, c = rc
                cell = grid[r][c]
                if event.button == 1:
                    left_down = True
                    left_click(cell)
                elif event.button == 3:
                    right_down = True
                    right_click(cell)
        
        if event.type == pygame.MOUSEBUTTONUP:
            if event.button == 1: 
                left_down = False
            if event.button == 3: 
                right_down = False

        if event.type == pygame.MOUSEMOTION:
            if left_down or right_down:
                pos = pygame.mouse.get_pos()
                rc = get_clicked_pos(pos)
                if rc is not None:
                    r, c = rc
                    cell = grid[r][c]
                    if left_down and cell is not start and cell is not end:
                        cell.make_wall()
                    elif right_down:
                        right_click(cell)

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_c:
                grid = grid_module.make_grid()
                start = None
                end = None
            if event.key == pygame.K_SPACE:
                if not start or not end:
                    print("Missing either start or end cell.")
                else:
                    algos.run_bfs(grid, start, end, draw_step)

    draw_window(WIN, grid)

pygame.quit()
