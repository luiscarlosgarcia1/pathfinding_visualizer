#pragma once
#include "grid.hpp"
#include <string>
using namespace std;

struct bfsResult;
struct astarResult;
struct dijkstraResult;

string pathfindingToJson(grid &g, const bfsResult &res);
string pathfindingToJson(grid &g, const astarResult &res);
string pathfindingToJson(grid &g, const dijkstraResult &res);
