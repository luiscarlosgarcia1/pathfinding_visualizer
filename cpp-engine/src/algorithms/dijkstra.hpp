#pragma once
#include "grid.hpp"
#include "helpers/dijkstraHelper.hpp"
using namespace std;

result dijkstra(grid &grid)
{
    dijkstraHelper h(&grid);

    while (!h.mpq.empty())
    {
        auto [cellDist, cell] = h.mpq.top();
        h.mpq.pop();

        if (h.seen[cell])
            continue;

        if (!(grid.isStart(cell) || grid.isEnd(cell)))
            h.visit(cell);

        if (grid.isEnd(cell))
        {
            h.createPath(cell);
            break;
        }
            
        if (cellDist == numeric_limits<int>::max())
            break;

        h.findNeighbors(cell);

        h.seen[cell] = true;
    }
    return h.getResult();
}
