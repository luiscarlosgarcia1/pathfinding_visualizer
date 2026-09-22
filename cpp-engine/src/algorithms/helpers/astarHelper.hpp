#pragma once
#include <cstdlib>
#include <functional>
#include <limits>
#include <queue>
#include <tuple>
#include <utility>
#include <vector>
#include "helper.hpp"

class astarHelper : public helper
{
public:
    vector<int> parents;
    vector<int> distances;
    int minimumTraversalCost;
    priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<tuple<int, int, int>>> mpq;

    astarHelper(grid* grid) : helper(grid)
    {
        parents = vector<int>(g->getGridSize(), -1);
        distances = vector<int>(g->getGridSize(), numeric_limits<int>::max());
        minimumTraversalCost = numeric_limits<int>::max();
        for (int cell = 0; cell < g->getGridSize(); ++cell) {
            if (g->isWall(cell)) continue;
            const int cost = g->weights[cell] < 1 ? 1 : g->weights[cell];
            if (cost < minimumTraversalCost) minimumTraversalCost = cost;
        }
        distances[g->getStart()] = 0;
        mpq.push({ heuristic(g->getStart()), 0, g->getStart() });
    }

    int heuristic(int cell)
    {
        int start = cell;
        int end = g->getEnd();
        int dims = g->getGridDims();

        int srow = start / dims;
        int scol = start % dims;
        int erow = end / dims;
        int ecol = end % dims;

        return distances[cell] + minimumTraversalCost * (abs(erow - srow) + abs(ecol - scol));
    }

    void findNeighbors(int cell)
    {
        for (int step : steps)
        {
            int neighbor = cell + step;

            if (!checkNeighbor(cell, step)) continue;
            if (g->isWall(neighbor)) continue;

            int cost = (g->weights[neighbor] < 1) ? 1 : g->weights[neighbor];
            if (distances[cell] + cost < distances[neighbor])
            {
                distances[neighbor] = distances[cell] + cost;
                parents[neighbor] = cell;
                mpq.push({ heuristic(neighbor), -distances[neighbor], neighbor });
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
