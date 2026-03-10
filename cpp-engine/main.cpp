
#include "grid.hpp"
#include "algorithms/bfs.hpp"
#include "algorithms/astar.hpp"
#include "algorithms/dijkstra.hpp"
#include "algorithms/prims.hpp"
#include "serializers/pathfinder_json.hpp"
#include "serializers/grid_json.hpp"
#include <chrono>
#include <cstdlib>
#include <iostream>
#include <string>
using namespace std;

static unsigned int getSeed(int argc, char* argv[], int seedArgIdx) {
    if (argc <= seedArgIdx || argv[seedArgIdx] == nullptr) return 0U;

    char* end = nullptr;
    unsigned long seed = strtoul(argv[seedArgIdx], &end, 10);
    if (end == argv[seedArgIdx]) return 0U;

    return static_cast<unsigned int>(seed);
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;

    grid g;
    string mode = argv[1];

    if (mode == "maze") {
        srand(getSeed(argc, argv, 2));
        prims(g);
        cout << gridToJson(g) << endl;
        return 0;
    }

    if (mode != "pathfind-maze")
        return 1;

    if (argc < 3) return 1;
    string algorithm = argv[2];

    srand(getSeed(argc, argv, 3));
    prims(g);

    auto startTime = chrono::steady_clock::now();
    result run;

    if (algorithm == "bfs")
        run = bfs(g);
    else if (algorithm == "astar")
        run = astar(g);
    else if (algorithm == "dijkstra")
        run = dijkstra(g);
    else
        return 1;

    auto endTime = chrono::steady_clock::now();
    run.algorithmRuntimeUs =
        chrono::duration_cast<chrono::microseconds>(endTime - startTime).count();

    cout << pathfindingToJson(run) << endl;
    return 0;
}
