
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
        res.found = true;

        int child = endIndx;
        while (!g->isStart(child))
        {
            if (parents[child] == -1)
                break;

            int stepCost = g->weights[child];
            res.totalDist += (stepCost < 1) ? 1 : stepCost;

            if (!g->isEnd(child))
                res.path.push_front(child);

            child = parents[child];
        }
    }
};
