#pragma once
#include "grid.hpp"
#include <string>
using namespace std;

struct bfsResult;
struct dijkstraResult;

string pathfindingToJson(grid &g, const bfsResult &res);
string pathfindingToJson(grid &g, const dijkstraResult &res);
