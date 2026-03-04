
#include "src/grid.hpp"
#include "src/algorithms/bfs/bfs.hpp"
#include "src/algorithms/prims/maze_gen.hpp"
#include "src/serializers/pathfinder_json.hpp"
#include "src/serializers/grid_json.hpp"
#include <cstdlib>
#include <iostream>
#include <string>
using namespace std;

static void makeEmptyGrid(grid &g) {
    for (int i = 0; i < g.getGridSize(); ++i)
        g.setEmpty(i);

    g.setStart(g.getStart());
    g.setEnd(g.getEnd());
}

static unsigned int parseSeedOrDefault(int argc, char* argv[], int seedArgIdx, unsigned int fallback) {
    if (argc <= seedArgIdx)
        return fallback;

    try {
        return static_cast<unsigned int>(stoul(argv[seedArgIdx]));
    } catch (...) {
        return fallback;
    }
}


int main(int argc, char* argv[]) {
    grid g;
    string mode = argc > 1 ? argv[1] : "bfs-empty";

    if (mode == "empty") {
        makeEmptyGrid(g);
        cout << gridToJson(g) << endl;
        return 0;
    }

    if (mode == "maze") {
        unsigned int seed = parseSeedOrDefault(argc, argv, 2, 0U);
        srand(seed);
        prims(g);
        cout << gridToJson(g) << endl;
        return 0;
    }

    if (mode == "bfs-empty") {
        makeEmptyGrid(g);
        bfsResult res = bfs(g);
        cout << pathfindingToJson(g, res.visitOrder, res.path, res.found) << endl;
        return 0;
    }

    if (mode == "bfs-maze") {
        unsigned int seed = parseSeedOrDefault(argc, argv, 2, 0U);
        srand(seed);
        prims(g);
        bfsResult res = bfs(g);
        cout << pathfindingToJson(g, res.visitOrder, res.path, res.found) << endl;
        return 0;
    }

    cerr << "Unknown mode: " << mode << endl;
    return 1;
}
