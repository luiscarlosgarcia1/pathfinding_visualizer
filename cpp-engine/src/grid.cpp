
#include "grid.hpp"

grid::grid()
{
    gridDims = config::read_grid_size("configs/config.json");
    gridSize = gridDims * gridDims;

    cells.reserve(gridSize);

    for (int i = 0; i < gridSize; i++)
    {
        cells.emplace_back(State::Empty);
    }
}
