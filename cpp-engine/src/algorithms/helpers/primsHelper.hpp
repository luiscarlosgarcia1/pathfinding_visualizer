
#pragma once
#include <cstdlib>
#include <utility>
#include <vector>
#include "helper.hpp"

class primsHelper : public helper
{
public:
    vector<int> frontiers;
    vector<int> directions;

    primsHelper(grid* grid) : helper(grid) 
    {
        directions = vector<int>(g->getGridSize(), 0);
    }
    
    void findFrontiers(int cell)
    {
        for (int step : steps)
        {
            int neighbor = cell + step;
            
            if(!checkNeighbor(cell, step)) continue;
            if (!g->isWall(neighbor)) continue;
            if (seen[neighbor]) continue;

            frontiers.push_back(neighbor);
            seen[neighbor] = true;
            directions[neighbor] = step;
        }
    }

    bool checkPassage(int frontier, int passage)
    {
        if (!checkNeighbor(frontier, directions[frontier]))
            return false;
        
        return g->isWall(frontier) && g->isWall(passage);
    }

    void popFrontier(int frontier)
    {
        int lastFrontier = frontiers.size() - 1;

        swap(frontiers[frontier], frontiers[lastFrontier]);
        frontiers.pop_back();
    }

    void setWeight(int cell)
    {
        int parent = cell - directions[cell];
        int parentWeight = g->weights[parent];
        int delta = (rand() % 7) - 3; // [-3, +3] for moderate local variation.
        int cellWeight = parentWeight + delta;

        if (cellWeight < 1) cellWeight = 1;
        if (cellWeight > 9) cellWeight = 9;

        g->weights[cell] = cellWeight;
    }

    void addRandomOpenings(int count = -1)
    {
        if (count < 0) count = g->getGridSize() / 5;
        for (int i = 0; i < count; i++)
        {
            int cell = rand() % g->getGridSize(), openNeighbors = 0;
            if (g->isStart(cell) || g->isEnd(cell) || !g->isWall(cell)) continue;
            for (int step : steps) { int n = cell + step; if (checkNeighbor(cell, step) && !g->isWall(n)) openNeighbors++; }
            if (openNeighbors < 2) continue;
            g->setEmpty(cell);
            g->weights[cell] = 1 + (rand() % 9);
        }
    }
};
