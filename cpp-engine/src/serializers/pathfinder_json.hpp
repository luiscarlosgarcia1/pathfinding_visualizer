#pragma once
#include "grid.hpp"
#include "grid_json.hpp"
#include <string>
using namespace std;

struct bfsResult;
struct astarResult;
struct dijkstraResult;

string pathfindingToJson(const bfsResult &res);
string pathfindingToJson(const astarResult &res);
string pathfindingToJson(const dijkstraResult &res);
