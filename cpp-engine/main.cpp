
#include "grid.hpp"
#include "algorithms/bfs/bfs.hpp"
#include "algorithms/dijkstra/dijkstra.hpp"
#include "algorithms/prims/maze_gen.hpp"
#include "serializers/pathfinder_json.hpp"
#include "serializers/grid_json.hpp"
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

static unsigned int parseSeedOrDefault(int argc, char* argv[], int seedArgIdx) {
    if (argc <= seedArgIdx) return 0U;
    try { return static_cast<unsigned int>(stoul(argv[seedArgIdx])); }
    catch (...) { return 0U; }
}


int main(int argc, char* argv[]) {
    grid g;
    string mode = argc > 1 ? argv[1] : "pathfind-empty";

    if (mode == "empty") {
        makeEmptyGrid(g);
        cout << gridToJson(g) << endl;
        return 0;
    }

    if (mode == "maze") {
        unsigned int seed = parseSeedOrDefault(argc, argv, 2);
        srand(seed);
        prims(g);
        cout << gridToJson(g) << endl;
        return 0;
    }

    if (mode == "pathfind-empty" || mode == "pathfind-maze") {
        string algorithm = argc > 2 ? argv[2] : "bfs";

        if (mode == "pathfind-empty") {
            makeEmptyGrid(g);
        } else {
            unsigned int seed = parseSeedOrDefault(argc, argv, 3);
            srand(seed);
            prims(g);
        }

        if (algorithm == "bfs") {
            bfsResult res = bfs(g);
            cout << pathfindingToJson(g, res) << endl;
            return 0;
        }

        if (algorithm == "dijkstra") {
            dijkstraResult res = dijkstra(g);
            cout << pathfindingToJson(g, res) << endl;
            return 0;
        }

        cerr << "Unknown pathfinding algorithm: " << algorithm << endl;
        return 1;
    }

    cerr << "Unknown mode: " << mode << endl;
    return 1;
}
