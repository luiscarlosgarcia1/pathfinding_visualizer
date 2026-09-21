
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

    // Prim's frontier growth does not promise to touch the reserved endpoints.
    // Carve a deterministic L-shaped corridor so every generated Layout is runnable.
    int current = grid.getStart();
    const int end = grid.getEnd();
    while (current % grid.getGridDims() != end % grid.getGridDims()) {
        current += (current % grid.getGridDims() < end % grid.getGridDims()) ? 1 : -1;
        if (!grid.isEnd(current)) grid.setEmpty(current);
        grid.weights[current] = 1;
    }
    while (current / grid.getGridDims() != end / grid.getGridDims()) {
        current += (current / grid.getGridDims() < end / grid.getGridDims())
            ? grid.getGridDims() : -grid.getGridDims();
        if (!grid.isEnd(current)) grid.setEmpty(current);
        grid.weights[current] = 1;
    }
}
