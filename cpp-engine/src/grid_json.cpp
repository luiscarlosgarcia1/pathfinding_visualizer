
#include "grid_json.hpp"

static const char* stateToString(State s) {
    switch (s) {
        case State::Empty: return "Empty";
        case State::Wall: return "Wall";
        case State::Start: return "Start";
        case State::End: return "End";
        default: return "Empty";
    }
}

string gridToJson(grid& g) {
    ostringstream out;

    out << "{";
    out << "\"gridDims\":" << g.getGridDims() << ",";
    out << "\"gridSize\":" << g.getGridSize() << ",";
    out << "\"cells\":[";
    
    const auto& cells = g.getCells();
    for (size_t i = 0; i < cells.size(); ++i) 
    {
        out << "\"" << stateToString(cells[i]) << "\"";

        if (!(i == cells.size() - 1)) 
            out << ",";
    }

    out << "]";
    out << "}";
    return out.str();
}
