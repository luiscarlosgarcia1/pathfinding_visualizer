
#include "pathfinder_json.hpp"
#include "algorithms/bfs/bfs.hpp"
#include "algorithms/astar/astar.hpp"
#include "algorithms/dijkstra/dijkstra.hpp"
#include <sstream>

static const char* pathStateToString(State s) {
    switch (s) {
        case State::Empty: return "Empty";
        case State::Wall: return "Wall";
        case State::Start: return "Start";
        case State::End: return "End";
        default: return "Empty";
    }
}

template <typename PathResult>
static string pathfindingToJsonImpl(grid &g, const PathResult &res)
{
    ostringstream out;

    out << "{";
    out << "\"gridDims\":" << g.getGridDims() << ",";
    out << "\"gridSize\":" << g.getGridSize() << ",";
    out << "\"cells\":[";

    const auto& cells = g.getCells();
    for (size_t i = 0; i < cells.size(); i++)
    {
        out << "\"" << pathStateToString(cells[i]) << "\"";
        if (i < cells.size() - 1)
            out << ",";
    }

    out << "],";
    out << "\"found\":" << (res.found ? "true" : "false") << ",";

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
    out << "}";

    return out.str();
}

string pathfindingToJson(grid &g, const bfsResult &res)
{
    return pathfindingToJsonImpl(g, res);
}

string pathfindingToJson(grid &g, const astarResult &res)
{
    return pathfindingToJsonImpl(g, res);
}

string pathfindingToJson(grid &g, const dijkstraResult &res)
{
    return pathfindingToJsonImpl(g, res);
}
