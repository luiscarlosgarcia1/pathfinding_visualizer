
#pragma once
#include "grid.hpp"
#include <sstream>
#include <string>
#include <vector>
using namespace std;

static string stateToString(State s)
{
    switch (s) {
        case State::Empty: return "Empty";
        case State::Wall: return "Wall";
        case State::Start: return "Start";
        case State::End: return "End";
        default: return "Empty";
    }
}

static int stateToInt(State s) 
{
    switch (s) {
        case State::Empty: return 0;
        case State::Wall: return 1;
        case State::Start: return 2;
        case State::End: return 3;
        default: return 0;
    }
}

static string gridFields(grid& g)
{
    vector<vector<int>> V(4);

    const auto &cells = g.getCells();
    for (size_t i = 0; i < cells.size(); i++)
        V[stateToInt(cells[static_cast<int>(i)])].push_back(i);

    ostringstream out;

    out << "\"gridDims\":" << g.getGridDims() << ",";
    out << "\"gridSize\":" << g.getGridSize() << ",";

    for (size_t i = 1; i < V.size(); i++)
    {
        out << "\"" << stateToString(cells[V[i][0]]) << "\":[";

        for (size_t j = 0; j < V[i].size(); j++)
        {
            out << V[i][j];
            if (j < V[i].size() - 1)
                out << ",";
        }

        out << "]";
        if (i < V.size() - 1)
            out << ",";
    }

    out << ",";

    const auto &weights = g.getWeights();
    out << "\"weights\":[";
    for (size_t i = 0; i < weights.size(); i++)
    {
        out << weights[static_cast<int>(i)];
        if (i < weights.size() - 1)
            out << ",";
    }
    out << "]";

    return out.str();
}

inline string gridToJson(grid& g)
{
    ostringstream out;

    out << "{\"grid\":{";
    out << gridFields(g);
    out << "}}";

    return out.str();
}
