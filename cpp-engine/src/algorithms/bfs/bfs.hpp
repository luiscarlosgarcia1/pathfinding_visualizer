
#pragma once
#include <vector>
#include <queue>
#include <deque>
#include "grid.hpp"
using namespace std;

struct bfsResult {
    vector<int> visitOrder;
    deque<int> path;
    bool found = false;
    long long algorithmRuntimeUs = 0;
};

bfsResult bfs(grid &g);
