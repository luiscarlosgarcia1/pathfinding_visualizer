#pragma once
#include "../grid.hpp"
#include <deque>
#include <string>
#include <vector>
using namespace std;

string pathfindingToJson(
    grid &g,
    const vector<int> &visitOrder,
    const deque<int> &path,
    bool found
);
