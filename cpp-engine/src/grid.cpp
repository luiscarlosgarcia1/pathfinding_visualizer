
#include "grid.hpp"

grid::grid(int dimensions)
{
    gridDims = dimensions;
    gridSize = gridDims * gridDims;
    startIdx = gridDims + 1;
    const int terminalCoordinate = gridDims % 2 == 0 ? gridDims - 3 : gridDims - 2;
    endIdx = terminalCoordinate * gridDims + terminalCoordinate;

    cells.reserve(gridSize);
    weights.reserve(gridSize);

    for (int i = 0; i < gridSize; i++)
        cells.push_back(State::Wall);

    cells[startIdx] = State::Start;
    cells[endIdx] = State::End;

    weights = vector<int>(gridSize, 1);
}


int grid::getGridDims() const
{ 
    return gridDims; 
}

int grid::getGridSize() const
{
    return gridSize;
}

int grid::getStart() const
{
    return startIdx;
}

int grid::getEnd() const
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


bool grid::isEmpty(int idx) const
{
    if (cells[idx] == State::Empty)
        return true;
    return false;
}

bool grid::isWall(int idx) const
{
    if (cells[idx] == State::Wall)
        return true;
    return false;
}

bool grid::isStart(int idx) const
{
    if (idx == startIdx)
        return true;
    return false;
}

bool grid::isEnd(int idx) const
{
    if (idx == endIdx)
        return true;
    return false;
}

const vector<State>& grid::getCells() const
{
    return cells;
}

const vector<int>& grid::getWeights() const
{
    return weights;
}
