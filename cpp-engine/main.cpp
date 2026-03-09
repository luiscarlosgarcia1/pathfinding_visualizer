
#include "grid.hpp"
#include "algorithms/bfs/bfs.hpp"
#include "algorithms/astar/astar.hpp"
#include "algorithms/dijkstra/dijkstra.hpp"
#include "algorithms/prims/maze_gen.hpp"
#include "serializers/pathfinder_json.hpp"
#include "serializers/grid_json.hpp"
#include <chrono>
#include <cstdlib>
#include <iostream>
#include <string>
using namespace std;

static void EmptyGrid(grid &g) {
    for (int i = 0; i < g.getGridSize(); ++i)
        g.setEmpty(i);

    g.setStart(g.getStart());
    g.setEnd(g.getEnd());
}

static unsigned int getSeed(int argc, char* argv[], int seedArgIdx) {
    if (argc <= seedArgIdx) return 0U;
    try { return static_cast<unsigned int>(stoul(argv[seedArgIdx])); }
    catch (...) { return 0U; }
}


int main(int argc, char* argv[]) {
    grid g;
    string mode = argv[1];

    if (mode == "empty") {
        EmptyGrid(g);
        cout << gridToJson(g) << endl;
        return 0;
    }

    if (mode == "maze") {
        srand(getSeed(argc, argv, 2));
        prims(g);
        cout << gridToJson(g) << endl;
        return 0;
    }

    if (mode == "pathfind-empty" || mode == "pathfind-maze") {
        string algorithm = argv[2];

        if (mode == "pathfind-empty") {
            EmptyGrid(g);
        } else {
            srand(getSeed(argc, argv, 3));
            prims(g);
        }

        if (algorithm == "bfs") {
            auto startTime = chrono::steady_clock::now();
            auto result = bfs(g);
            auto endTime = chrono::steady_clock::now();
            result.algorithmRuntimeUs = chrono::duration_cast<chrono::microseconds>(endTime - startTime).count();
            cout << pathfindingToJson(result) << endl;
            return 0;
        }

        if (algorithm == "astar") {
            auto startTime = chrono::steady_clock::now();
            auto result = astar(g);
            auto endTime = chrono::steady_clock::now();
            result.algorithmRuntimeUs = chrono::duration_cast<chrono::microseconds>(endTime - startTime).count();
            cout << pathfindingToJson(result) << endl;
            return 0;
        }

        if (algorithm == "dijkstra") {
            auto startTime = chrono::steady_clock::now();
            auto result = dijkstra(g);
            auto endTime = chrono::steady_clock::now();
            result.algorithmRuntimeUs = chrono::duration_cast<chrono::microseconds>(endTime - startTime).count();
            cout << pathfindingToJson(result) << endl;
            return 0;
        }
        return 1;
    }
    return 1;
}
