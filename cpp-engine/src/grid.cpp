
#include "grid.hpp"

grid::grid()
{
    gridDims = config::read_grid_size("configs/config.json");
    gridSize = gridDims * gridDims;
    startIdx = gridDims*2 + 2;
    endIdx = gridSize - gridDims*2 - 3;

    cells.reserve(gridSize);

    for (int i = 0; i < gridSize; i++)
        cells.push_back(State::Wall);

    cells[startIdx] = State::Start;
    cells[endIdx] = State::End;
}


int grid::getGridDims() 
{ 
    return gridDims; 
}

int grid::getGridSize() 
{
    return gridSize;
}

int grid::getStart()
{
    return startIdx;
}

int grid::getEnd()
{
    return endIdx;
}


void grid::setEmpty(int idx) 
{   
    cells[idx] = State::Empty;
}

void grid::setWall(int idx)
{
    cells[idx] = State::Wall;
}

void grid::setStart(int idx)
{
    cells[idx] = State::Start;
}

void grid::setEnd(int idx)
{
    cells[idx] = State::End;
}


bool grid::isEmpty(int idx)
{
    if (cells[idx] == State::Empty)
        return true;
    return false;
}

bool grid::isWall(int idx)
{
    if (cells[idx] == State::Wall)
        return true;
    return false;
}

bool grid::isStart(int idx)
{
    if (idx == startIdx)
        return true;
    return false;
}

bool grid::isEnd(int idx)
{
    if (idx == endIdx)
        return true;
    return false;
}

vector<State>& grid::getCells() 
{
    return cells;
}
