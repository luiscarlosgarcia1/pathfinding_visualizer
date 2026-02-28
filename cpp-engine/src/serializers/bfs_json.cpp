
#include "bfs_json.hpp"

static const char* stateToString(State s) {
    switch (s) {
        case State::Empty: return "Empty";
        case State::Wall: return "Wall";
        case State::Start: return "Start";
        case State::End: return "End";
        default: return "Empty";
    }
}

string bfsToJson(grid &g, const result &res) {
    ostringstream out;

    out << "{";
    out << "\"gridDims\":" << g.getGridDims() << ",";
    out << "\"gridSize\":" << g.getGridSize() << ",";
    out << "\"cells\":[";
    
    const auto& cells = g.getCells();
    for (size_t i = 0; i < cells.size(); i++) 
    {
        out << "\"" << stateToString(cells[i]) << "\"";
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
