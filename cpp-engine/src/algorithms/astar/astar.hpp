#pragma once
#include <deque>
#include <vector>
#include "grid.hpp"
using namespace std;

struct astarResult {
    vector<int> visitOrder;
    deque<int> path;
    bool found = false;
    long long algorithmRuntimeUs = 0;
};

astarResult astar(grid &g);
