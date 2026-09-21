
#pragma once
#include <queue>
#include <vector>
#include "helper.hpp"

class bfsHelper : public helper
{
public:
    queue<int> neighbors;
    vector<int> parents;

    bfsHelper(grid* grid) : helper(grid)
    {
        neighbors.push(g->getStart());
        seen[g->getStart()] = true;
        parents = vector<int>(g->getGridSize(), -1);
    }

    void findNeighbors(int cell)
    {
        for (int step : steps)
        {
            int neighbor = cell + step;
            
            if(!checkNeighbor(cell, step)) continue;
            if (g->isWall(neighbor)) continue;
            if (seen[neighbor]) continue;

            neighbors.push(neighbor);
            seen[neighbor] = true;  
            parents[neighbor] = cell;
        }
    }

    void createPath(int endIndx)
    {
        if (endIndx < 0 || parents[endIndx] == -1)
            return;
        res.found = true;

        int child = endIndx;
        res.path.push_front(child);
        while (!g->isStart(child)) {
            res.totalDist += 1;
            child = parents[child];
            res.path.push_front(child);
        }
    }
};
