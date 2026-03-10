
#pragma once
#include <vector>
#include "grid.hpp"
#include "algorithms/result.hpp"


class helper
{
protected:
    grid* g;
    result res;
    int steps[4];

    bool checkNeighbor(int cellIdx, int offset)
    {
        int row = g->getGridDims();
        int neighbor = cellIdx + offset;

        // wrap around guard for horizontal movement only
        if (offset == 1 || offset == -1)
            if (neighbor / row != cellIdx / row)
                return false;

        // out of bounds guard
        if (!(0 <= neighbor && neighbor < g->getGridSize()))
            return false;

        return true;
    }

public:
    vector<bool> seen;
    helper(grid* grid)
    {
        g = grid;

        steps[0] = -g->getGridDims();
        steps[1] = 1;
        steps[2] = g->getGridDims();
        steps[3] = -1;

        seen = vector<bool>(g->getGridSize(), false);
    }
    ~helper() = default;

    void visit(int cellIdx)
    {
        res.visitOrder.push_back(cellIdx);
    }

    result getResult()
    {
        return res;
    }
};
