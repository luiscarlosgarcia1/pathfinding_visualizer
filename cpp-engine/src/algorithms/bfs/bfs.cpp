
#include "bfs.hpp"

static void findNeighbors(struct bfsContext &ctx, int curCell);
static void createPath(struct bfsContext &ctx, int endIndx);

struct bfsContext {
    grid &grid;
    queue<int> neighbors;
    vector<int> parents;
    vector<bool> seen;
    bfsResult res;

    bfsContext(class grid &g) : grid(g)
    {
        parents = vector<int>(g.getGridSize(), -1);
        seen = vector<bool>(g.getGridSize(), false);

        neighbors.push(g.getStart());
        seen[g.getStart()] = true;
    }
};


bfsResult bfs(grid &grid)
{
    bfsContext context(grid);

    while (!context.neighbors.empty())
    {
        int cell = context.neighbors.front();
        context.neighbors.pop();
        
        if(grid.isWall(cell)) 
            continue;

        if(grid.isEnd(cell))
        {
            createPath(context, cell);
            context.res.found = true;
            return context.res;
        }

        if (!grid.isStart(cell))
            context.res.visitOrder.push_back(cell);
        
        findNeighbors(context, cell);
    }
    return context.res;
}


// helper to find all neighbors of a given cell
static void findNeighbors(bfsContext &ctx, int curCell)
{
    int rowLength = ctx.grid.getGridDims();

    // up, right, down, left in grid
    int steps[4] = { -rowLength, 1, rowLength, -1 };

    for (int step : steps)
    {
        int possibleNeighbor = curCell + step;
        
        // wrap around guard for horizontal movement only
        if (step == 1 || step == -1)
            if (possibleNeighbor / rowLength != curCell / rowLength)
                continue;

        // out of bounds guard
        if (!(0 <= possibleNeighbor && possibleNeighbor < ctx.grid.getGridSize())) 
            continue;

        // already seen guard
        if (ctx.seen[possibleNeighbor])
            continue;

        ctx.neighbors.push(possibleNeighbor);
        ctx.seen[possibleNeighbor] = true;  
        ctx.parents[possibleNeighbor] = curCell;
    }
}


//create path will backtrack using parents adding indecies to path as we go
static void createPath(bfsContext &ctx, int endIndx)
{
    int child = endIndx;

    while (!ctx.grid.isStart(ctx.parents[child]))
    {
        child = ctx.parents[child];
        ctx.res.path.push_front(child);
    }
}
