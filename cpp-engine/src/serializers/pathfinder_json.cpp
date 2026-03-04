
#include "pathfinder_json.hpp"
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

string pathfindingToJson( grid &g, const vector<int> &visitOrder, const deque<int> &path, bool found)
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
    out << "\"found\":" << (found ? "true" : "false") << ",";

    out << "\"visitOrder\":[";
    for (size_t i = 0; i < visitOrder.size(); i++)
    {
        out << visitOrder[i];
        if (i < visitOrder.size() - 1)
            out << ",";
    }
    out << "],";

    out << "\"path\":[";
    for (size_t i = 0; i < path.size(); i++)
    {
        out << path[i];
        if (i < path.size() - 1)
            out << ",";
    }
    out << "]";
    out << "}";

    return out.str();
}
