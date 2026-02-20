
#pragma once
#include "cpp-engine/src/config/grid_size_reader.hpp"
#include <vector>
using namespace std;

enum class State {
    Empty,
    Wall,
    Start,
    End,
    Visited,
    Path,
    Line
};

// {0, 0, 0};
// {200, 200, 200};
// {0, 255, 0};
// {255, 0, 0};
// {100, 150, 255};
// {255, 165, 0};
// {50, 50, 50};

class grid
{
private:
    int gridDims;
    int gridSize;

    class cell
    {
    public:
        State state;
        cell (State st) 
        {
            state = st;
        }
    };

    vector<cell> cells;


public:
    grid();
    ~grid() = default;

    int getGridDims();
    int getGridSize();
    const vector<cell>& getCells();
};
