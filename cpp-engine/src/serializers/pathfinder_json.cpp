
#include "pathfinder_json.hpp"
#include "algorithms/bfs/bfs.hpp"
#include "algorithms/astar/astar.hpp"
#include "algorithms/dijkstra/dijkstra.hpp"
#include <sstream>

static string StateToString(State s) {
    switch (s) {
        case State::Empty: return "Empty";
        case State::Wall: return "Wall";
        case State::Start: return "Start";
        case State::End: return "End";
        default: return "Empty";
    }
}

template <typename PathResult>
static string pathfindingFields(grid &g, const PathResult &res)
{
    ostringstream out;

    out << "\"found\":" << (res.found ? "true" : "false") << ",";
    out << "\"algorithmRuntimeUs\":" << res.algorithmRuntimeUs << ",";

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


string pathfindingToJson(grid& g, const bfsResult &res) {
    ostringstream out;
    
    out << "{\"pathfinder\":{";
    out << pathfindingFields(g, res);
    out << "}";

    return out.str();
}

string pathfindingToJson(grid& g, const dijkstraResult &res) {
    ostringstream out;
    
    out << "{\"pathfinder\":{";
    out << pathfindingFields(g, res);
    out << "}";

    return out.str();
}


string pathfindingToJson(grid& g, const astarResult &res) {
    ostringstream out;
    
    out << "{\"pathfinder\":{";
    out << pathfindingFields(g, res);
    out << "}";

    return out.str();
}
