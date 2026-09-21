
#pragma once
#include <functional>
#include <limits>
#include <queue>
#include <utility>
#include <vector>
#include "helper.hpp"

class dijkstraHelper : public helper
{
public:
    vector<int> parents;
    vector<int> distances;
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> mpq;


    dijkstraHelper(grid* grid) : helper(grid)
    {
        parents = vector<int>(g->getGridSize(), -1);
        distances = vector<int>(g->getGridSize(), numeric_limits<int>::max());
        distances[g->getStart()] = 0;
        mpq.push({ distances[g->getStart()], g->getStart() });
    }

    void findNeighbors(int cell)
    {
        for (int step : steps)
        {
            int neighbor = cell + step;
            
            if(!checkNeighbor(cell, step)) continue;
            if (g->isWall(neighbor)) continue;

            int cost = (g->weights[neighbor] < 1) ? 1 : g->weights[neighbor];
            if (distances[cell] + cost < distances[neighbor])
            {
                distances[neighbor] = distances[cell] + cost;
                parents[neighbor] = cell;
                mpq.push({ distances[neighbor], neighbor });
            }
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
            int stepCost = g->weights[child];
            res.totalDist += (stepCost < 1) ? 1 : stepCost;
            child = parents[child];
            res.path.push_front(child);
        }
    }
};
