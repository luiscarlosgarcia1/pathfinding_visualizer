#pragma once
#include "grid.hpp"
#include "algorithms/result.hpp"
#include <sstream>
using namespace std;

inline string pathfindingToJson(const result &res) {
    ostringstream out;
    
    out << "{\"pathfinder\":{";
    out << "\"found\":" << (res.found ? "true" : "false") << ",";
    out << "\"algorithmRuntimeUs\":" << res.algorithmRuntimeUs << ",";
    out << "\"totalDistance\":" << res.totalDist << ",";

    out << "\"visitOrder\":[";
    for (size_t i = 0; i < res.visitOrder.size(); i++)
    {
        out << res.visitOrder[i];
        if (i < res.visitOrder.size() - 1)
            out << ",";
    }
    out << "],";

    out << "\"path\":[";
    for (size_t i = 0; i < res.path.size(); i++)
    {
        out << res.path[i];
        if (i < res.path.size() - 1)
            out << ",";
    }
    out << "]";

    out << "}}";

    return out.str();
}
