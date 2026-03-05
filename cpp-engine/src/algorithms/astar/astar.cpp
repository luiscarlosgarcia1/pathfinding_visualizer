#include "astar.hpp"
#include <limits>
#include <queue>
#include <math.h>

struct astarContext {
    grid &grid;
    priority_queue< pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>> > mpq; // min-priority queue (distance, cellIdx)
    vector<int> distances;
    vector<int> parents;
    vector<bool> seen;
    astarResult res;

    astarContext(class grid &g) : grid(g)
    {
        distances = vector<int>(g.getGridSize(), numeric_limits<int>::max());   // set all distances to "infinity"
        parents = vector<int>(g.getGridSize(), -1);
        seen = vector<bool>(g.getGridSize(), false);

        distances[g.getStart()] = 0;    // set start cell distance to 0
        mpq.push({ distances[g.getStart()] + heuristic(g, g.getStart()), g.getStart() });    // initialize min-priority queue with start
    }
};

static void updateNeighbors(astarContext &ctx, int curCell);
static void createPath(astarContext &ctx, int endIndx);
static int heuristic(grid& grid, int cell);

astarResult astar(grid &grid)
{
    astarContext context(grid);

    while (!context.mpq.empty())
    {
        auto [cellDist, cellIdx] = context.mpq.top();
        context.mpq.pop();

        if (context.seen[cellIdx])
            continue;

        if (!(grid.isStart(cellIdx) || grid.isEnd(cellIdx)))
            context.res.visitOrder.push_back(cellIdx);

        // if current node is target node or has dist infinity, break and terminiate
        if (grid.isEnd(cellIdx))
        {
            context.res.found = true;
            createPath(context, cellIdx);
            return context.res;
        }
            
        if (context.distances[cellIdx] == numeric_limits<int>::max())
            return context.res;

        // update neighbors
        updateNeighbors(context, cellIdx);

        // mark cur as seen
        context.seen[cellIdx] = true;
    }
    return context.res;
}


static void updateNeighbors(astarContext &ctx, int curCell)
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

        if (ctx.grid.isWall(possibleNeighbor))
            continue;

        // if cidst < ndist
        if (ctx.distances[curCell] + 1 < ctx.distances[possibleNeighbor])
        {
            ctx.distances[possibleNeighbor] = ctx.distances[curCell] + 1;
            ctx.parents[possibleNeighbor] = curCell;
            ctx.mpq.push({ ctx.distances[possibleNeighbor] + heuristic(ctx.grid, possibleNeighbor), possibleNeighbor });
        }
    }
}

static void createPath(astarContext &ctx, int endIndx)
{
    int child = endIndx;

    while (!ctx.grid.isStart(ctx.parents[child]))
    {
        child = ctx.parents[child];
        ctx.res.path.push_front(child);
    }
}

static int heuristic(grid& grid, int cell)
{
    int start = cell;
    int end = grid.getEnd();
    int dims = grid.getGridDims();

    int srow = start / dims;
    int scol = start % dims;
    int erow = end / dims;
    int ecol = end % dims;



    return abs(erow - srow) + abs(ecol - scol);
}