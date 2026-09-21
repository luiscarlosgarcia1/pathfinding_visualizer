
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
    


public:
    explicit grid(int dimensions);
    ~grid() = default;

    int getGridDims() const;
    int getGridSize() const;
    int getStart() const;
    int getEnd() const;

    void setEmpty(int idx);
    void setWall(int idx);
    void setStart(int idx);
    void setEnd(int idx);

    bool isEmpty(int idx) const;
    bool isWall(int idx) const;
    bool isStart(int idx) const;
    bool isEnd(int idx) const;

    const vector<State>& getCells() const;
    const vector<int>& getWeights() const;

    vector<int> weights;
};
