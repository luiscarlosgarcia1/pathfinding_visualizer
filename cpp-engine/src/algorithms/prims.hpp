
#pragma once
#include "grid.hpp"
#include "helpers/primsHelper.hpp"


void prims(grid &grid)
{
    primsHelper h(&grid);

    int origin = grid.getGridSize() / 2;
    grid.setEmpty(origin);

    h.findFrontiers(origin);

    while (!h.frontiers.empty())
    {
        int randIndx = rand() % h.frontiers.size();
        int frontier = h.frontiers[randIndx];
        int passage = frontier + h.directions[frontier];

        if (h.checkPassage(frontier, passage))
        {
            grid.setEmpty(frontier);
            grid.setEmpty(passage);
    
            h.setWeight(frontier);
            h.setWeight(passage);

            h.findFrontiers(passage);
        }

        h.popFrontier(randIndx);
    }
    h.addRandomOpenings();
}
