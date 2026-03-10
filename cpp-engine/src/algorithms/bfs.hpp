
#pragma once
#include "grid.hpp"
#include "helpers/bfsHelper.hpp"
using namespace std;

result bfs(grid &grid)
{
    bfsHelper h(&grid);

    int cell;
    while (!h.neighbors.empty())
    {
        cell = h.neighbors.front();
        h.neighbors.pop();

        if(grid.isEnd(cell))
            break;

        if (!grid.isStart(cell))
            h.visit(cell);
        
        h.findNeighbors(cell);
    }
    h.createPath(cell);
    return h.getResult();
}
