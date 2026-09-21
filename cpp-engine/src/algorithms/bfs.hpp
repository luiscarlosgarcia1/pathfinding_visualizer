
#pragma once
#include "grid.hpp"
#include "helpers/bfsHelper.hpp"
using namespace std;

result bfs(grid &grid)
{
    bfsHelper h(&grid);

    int cell = -1;
    while (!h.neighbors.empty())
    {
        cell = h.neighbors.front();
        h.neighbors.pop();

        if(grid.isEnd(cell)) {
            h.createPath(cell);
            break;
        }

        if (!grid.isStart(cell))
            h.visit(cell);
        
        h.findNeighbors(cell);
    }
    return h.getResult();
}
