#pragma once
#include <deque>
#include <vector>
#include "grid.hpp"
using namespace std;

struct astarResult {
    vector<int> visitOrder;
    deque<int> path;
    bool found = false;
};

astarResult astar(grid &g);
