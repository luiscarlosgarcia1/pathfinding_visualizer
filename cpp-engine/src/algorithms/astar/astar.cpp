#include "astar.hpp"
#include <limits>
#include <queue>
#include <math.h>

struct astarContext;
static int heuristic(const astarContext &ctx, int cell);

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
        mpq.push({ heuristic(*this, g.getStart()), g.getStart() });    // initialize min-priority queue with start
    }
};

static void updateNeighbors(astarContext &ctx, int curCell);
static void createPath(astarContext &ctx, int endIndx);

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
    const auto &weights = ctx.grid.getWeights();

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

        int stepCost = weights[possibleNeighbor];
        if (stepCost < 1) stepCost = 1;

        if (ctx.distances[curCell] + stepCost < ctx.distances[possibleNeighbor])
        {
            ctx.distances[possibleNeighbor] = ctx.distances[curCell] + stepCost;
            ctx.parents[possibleNeighbor] = curCell;
            ctx.mpq.push({ heuristic(ctx, possibleNeighbor), possibleNeighbor });
        }
    }
}

static void createPath(astarContext &ctx, int endIndx)
{
    int child = endIndx;

    while (!ctx.grid.isStart(child))
    {
        int parent = ctx.parents[child];
        if (parent == -1)
            break;

        int edgeCost = ctx.grid.weights[child];
        ctx.res.totalDistance += (edgeCost < 1) ? 1 : edgeCost;

        if (!ctx.grid.isEnd(child))
            ctx.res.path.push_front(child);

        child = parent;
    }
}

static int heuristic(const astarContext &ctx, int cell)
{
    int start = cell;
    int end = ctx.grid.getEnd();
    int dims = ctx.grid.getGridDims();

    int srow = start / dims;
    int scol = start % dims;
    int erow = end / dims;
    int ecol = end % dims;

    return ctx.distances[cell] + abs(erow - srow) + abs(ecol - scol);
}
