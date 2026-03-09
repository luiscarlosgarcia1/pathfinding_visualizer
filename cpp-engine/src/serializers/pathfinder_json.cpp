
#include "pathfinder_json.hpp"
#include "algorithms/bfs/bfs.hpp"
#include "algorithms/astar/astar.hpp"
#include "algorithms/dijkstra/dijkstra.hpp"
#include <sstream>

template <typename PathResult>
static string pathfindingFields(const PathResult &res)
{
    ostringstream out;

    out << "\"found\":" << (res.found ? "true" : "false") << ",";
    out << "\"algorithmRuntimeUs\":" << res.algorithmRuntimeUs << ",";
    out << "\"totalDistance\":" << res.totalDistance << ",";

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

    return out.str();
}


string pathfindingToJson(const bfsResult &res) {
    ostringstream out;
    
    out << "{\"pathfinder\":{";
    out << pathfindingFields(res);
    out << "}";

    return out.str();
}

string pathfindingToJson(const dijkstraResult &res) {
    ostringstream out;
    
    out << "{\"pathfinder\":{";
    out << pathfindingFields(res);
    out << "}";

    return out.str();
}


string pathfindingToJson(const astarResult &res) {
    ostringstream out;
    
    out << "{\"pathfinder\":{";
    out << pathfindingFields(res);
    out << "}";

    return out.str();
}
