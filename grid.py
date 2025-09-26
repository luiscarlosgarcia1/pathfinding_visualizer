import pygame

# creates square grid
ROWS, COLS = 25, 25
WIDTH, HEIGHT = 1000, 1000   # pixels
CELL_SIZE = WIDTH // COLS   # pixels

# Colors (R, G, B)
WHITE = (255, 255, 255)   # empty cell
BLACK = (0, 0, 0)         # wall
GREEN = (0, 255, 0)       # start
RED = (255, 0, 0)         # end
BLUE = (0, 0, 255)        # visited nodes
PURPLE = (128, 0, 128)    # final path
GREY = (200, 200, 200)    # grid lines

class Cell:
    def __init__(self, row, col, width, total_rows):
        self.row = row
        self.col = col
        self.width = width
        self.total_rows = total_rows
        self.x = col * width
        self.y = row * width
        self.color = WHITE
        self.iswall = False

    def draw(self, surface):
        pygame.draw.rect(surface, self.color, (self.x, self.y, self.width, self.width))
        pygame.draw.rect(surface, GREY, (self.x, self.y, self.width, self.width), 1)

    def make_start(self):
        self.color = GREEN

    def make_end(self):
        self.color = RED

    def make_wall(self):
        self.color = BLACK
        self.iswall = True

    def reset(self):
        self.color = WHITE
        self.iswall = False
    
def make_grid():
    grid = []
    for r in range(ROWS):
        row = []
        for c in range(COLS):
            cell = Cell(r, c, CELL_SIZE, ROWS)
            row.append(cell)
        grid.append(row)        
    return grid

def neighbors(grid, cell):
    r, c = cell.row, cell.col
    steps = [(-1,0),(0,1),(1,0),(0,-1)]

    neighbors = []
    for sr, sc in steps:
        rr, cc = r + sr, c + sc
        if 0 <= rr < ROWS and 0 <= cc < COLS:
            neighbors.append(grid[rr][cc])
        else:
            neighbors.append(None)
    return neighbors

def draw_grid(surface, grid):
    for r in range(ROWS):
        for c in range(COLS):
            grid[r][c].draw(surface)