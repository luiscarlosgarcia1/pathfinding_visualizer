#pragma once
#include <deque>
#include <vector>
#include "grid.hpp"
using namespace std;

struct dijkstraResult {
    vector<int> visitOrder;
    deque<int> path;
    bool found = false;
};

dijkstraResult dijkstra(grid &g);
