import pygame
import math
import random

# creates square grid
ROWS, COLS = 50, 50
WIDTH, HEIGHT = 800, 800   # pixels
CELL_SIZE = WIDTH // COLS   # pixels

# Colors (R, G, B)
BLACK = (0, 0, 0)   # empty cell
LIGHT_GREY = (200, 200, 200)         # wall
GREEN = (0, 255, 0)       # start
RED = (255, 0, 0)         # end
BLUE = (100, 150, 255)        # visited nodes
ORANGE = (255, 165, 0)    # final path
GREY = (50, 50, 50)    # grid lines

class Cell:
    def __init__(self, row, col, width, total_rows):
        self.row = row
        self.col = col
        self.width = width
        self.total_rows = total_rows
        self.x = col * width
        self.y = row * width
        self.color = BLACK
        self.iswall = False

    def draw(self, surface):
        pygame.draw.rect(surface, self.color, (self.x, self.y, self.width, self.width))
        pygame.draw.rect(surface, GREY, (self.x, self.y, self.width, self.width), 1)

    def make_start(self):
        self.color = GREEN

    def make_end(self):
        self.color = RED

    def make_wall(self):
        self.color = LIGHT_GREY
        self.iswall = True

    def reset(self):
        self.color = BLACK
        self.iswall = False

def _fade(t):  # 6t^5 - 15t^4 + 10t^3
    return t * t * t * (t * (t * 6 - 15) + 10)

def _lerp(a, b, t):
    return a + t * (b - a)

def _grad(hash_, x, y):
    # 2D gradient from hash (like Ken Perlin's improved noise)
    h = hash_ & 7  # 8 gradients
    u = x if h < 4 else y
    v = y if h < 4 else x
    return ((u if (h & 1) == 0 else -u) + (v if (h & 2) == 0 else -v))

def _make_perm(seed):
    rng = random.Random(seed)
    p = list(range(256))
    rng.shuffle(p)
    return p + p  # repeat to avoid overflow

def perlin2d(x, y, perm):
    # Lattice coords
    xi = int(math.floor(x)) & 255
    yi = int(math.floor(y)) & 255
    xf = x - math.floor(x)
    yf = y - math.floor(y)

    u = _fade(xf)
    v = _fade(yf)

    aa = perm[perm[xi] + yi]
    ab = perm[perm[xi] + yi + 1]
    ba = perm[perm[xi + 1] + yi]
    bb = perm[perm[xi + 1] + yi + 1]

    x1 = _lerp(_grad(aa, xf,     yf    ),
               _grad(ba, xf - 1, yf    ), u)
    x2 = _lerp(_grad(ab, xf,     yf - 1),
               _grad(bb, xf - 1, yf - 1), u)
    return _lerp(x1, x2, v)  # in roughly [-1, 1]

def apply_perlin_walls(grid, scale=10.0, threshold=0.55, seed=0):
    """
    Fills the grid with walls where Perlin noise > threshold.
    - scale: bigger => smoother blobs; smaller => noisier speckle
    - threshold: [0..1]; higher => fewer walls
    """
    perm = _make_perm(seed)
    rows, cols = ROWS, COLS
    for r in range(rows):
        for c in range(cols):
            # map grid cell to noise coords; tweak scale as you like
            nx = c / scale
            ny = r / scale
            n = perlin2d(nx, ny, perm)
            n01 = (n + 1) * 0.5  # normalize to [0, 1]
            if n01 > threshold:
                grid[r][c].make_wall()
    
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

def draw_grid(window, grid):
    for r in range(ROWS):
        for c in range(COLS):
            grid[r][c].draw(window)