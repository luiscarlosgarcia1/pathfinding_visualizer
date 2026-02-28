
#include "src/grid.hpp"
#include "src/algorithms/bfs/bfs.hpp"
#include "src/serializers/bfs_json.hpp"
#include <iostream>
#include <string>
using namespace std;


int main(int argc, char* argv[]) {
    grid g;

    cout << bfsToJson(g, bfs(g)) << endl;
    
    return 0;
}
