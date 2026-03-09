
#pragma once
#include "config/grid_size_reader.hpp"
#include <vector>
using namespace std;

enum class State {
    Empty, // {0, 0, 0}
    Wall,  // {200, 200, 200}
    Start, // {0, 255, 0}
    End    // {255, 0, 0}
};

class grid
{
private:
    int gridDims;
    int gridSize;

    int startIdx;
    int endIdx;
    
    vector<State> cells;
    vector<int> weights;
    


public:
    grid();
    ~grid() = default;

    int getGridDims();
    int getGridSize();
    int getStart();
    int getEnd();

    void setEmpty(int idx);
    void setWall(int idx);
    void setStart(int idx);
    void setEnd(int idx);

    bool isEmpty(int idx);
    bool isWall(int idx);
    bool isStart(int idx);
    bool isEnd(int idx);

    vector<State>& getCells();
    vector<int>& getWeights();
};
