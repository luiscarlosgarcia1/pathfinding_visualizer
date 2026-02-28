
#pragma once
#include <vector>
#include <queue>
#include <deque>
#include "../../grid.hpp"
using namespace std;

struct result {
    vector<int> visitOrder;
    deque<int> path;
    bool found = false;
};

result bfs(grid &g);
