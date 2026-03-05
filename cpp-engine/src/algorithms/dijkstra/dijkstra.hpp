#pragma once
#include <deque>
#include <vector>
#include "grid.hpp"
using namespace std;

struct dijkstraResult {
    vector<int> visitOrder;
    deque<int> path;
    bool found = false;
    long long algorithmRuntimeUs = 0;
};

dijkstraResult dijkstra(grid &g);
