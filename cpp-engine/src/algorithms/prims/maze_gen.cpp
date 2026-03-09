
#include "maze_gen.hpp"
#include <cstdlib>
#include <cstdlib>
#include <ctime>

struct mazeContex 
{
    grid &grid;
    vector<int> frontiers;  // cells adjacent to those alr in the maze
    vector<int> direction;  // direction frontier is traveling towards
    vector<bool> seen;      // cells that have already been in frontiers

    mazeContex(class grid &g) : grid(g)
    {
        direction = vector<int>(g.getGridSize(), 0);
        seen = vector<bool>(g.getGridSize(), false);
    }
};

static void findFrontiers(mazeContex &ctx, int cell);
static bool checkPassage(mazeContex &ctx, int frontier, int passage);
static bool checkNeighbor(mazeContex &ctx, int cell, int offset);
static void popFrontier(mazeContex &ctx, int frontierIndx);
static void setWeight(mazeContex &ctx, int cell);


void prims(grid &grid)
{
    mazeContex context(grid);

    int origin = grid.getGridSize() / 2;
    grid.setEmpty(origin);

    findFrontiers(context, origin);

    while (!context.frontiers.empty())
    {
        int randIndx = rand() % context.frontiers.size();
        int randFrontier = context.frontiers[randIndx];
        int possiblePassage = randFrontier + context.direction[randFrontier];

        if (checkPassage(context, randFrontier, possiblePassage))
        {
            grid.setEmpty(randFrontier);
            grid.setEmpty(possiblePassage);
    
            setWeight(context, randFrontier);
            setWeight(context, possiblePassage);

            findFrontiers(context, possiblePassage);
        }

        popFrontier(context, randIndx);
    }
}


// helper to find all frontiers next to given cell
static void findFrontiers(mazeContex &ctx, int cell)
{
    // up, right, down, left in grid
    int rowLength = ctx.grid.getGridDims();
    int steps[4] = { -rowLength, 1, rowLength, -1 };

    for (int step : steps)
    {
        if (!checkNeighbor(ctx, cell, step))
            continue;

        int possibleFrontier = cell + step;

        // non-wall guard
        if (!ctx.grid.isWall(possibleFrontier))
            continue;

        // already seen guard
        if (ctx.seen[possibleFrontier])
            continue;

        ctx.frontiers.push_back(possibleFrontier);
        ctx.seen[possibleFrontier] = true;
        ctx.direction[possibleFrontier] = step;
    }
}

// helper for examining a possible passage
static bool checkPassage(mazeContex &ctx, int frontier, int passage)
{
    if (!checkNeighbor(ctx, frontier, ctx.direction[frontier]))
        return false;
    
    return ctx.grid.isWall(frontier) && ctx.grid.isWall(passage);
}       

// helper for checking bounds on possible neighbors
static bool checkNeighbor(mazeContex &ctx, int cell, int offset)
{
    int rowLength = ctx.grid.getGridDims();
    int possibleNeighbor = cell + offset;

    // wrap around guard for horizontal movement only
    if (offset == 1 || offset == -1)
        if (possibleNeighbor / rowLength != cell / rowLength)
            return false;

    // out of bounds guard
    if (!(0 <= possibleNeighbor && possibleNeighbor < ctx.grid.getGridSize()))
        return false;

    return true;
}

// helper for removing frontiers
static void popFrontier(mazeContex &ctx, int frontierIndx)
{
    int lastFrontierIndx = ctx.frontiers.size() - 1;
    swap(ctx.frontiers[frontierIndx], ctx.frontiers[lastFrontierIndx]);

    ctx.frontiers.pop_back();
}

static void setWeight(mazeContex &ctx, int cell)
{
    auto &weights = ctx.grid.getWeights();

    int prevWeight = weights[cell - ctx.direction[cell]];
    int newWeight = prevWeight + (rand() % 2 ? 1 : -1);

    weights[cell] = newWeight;
}