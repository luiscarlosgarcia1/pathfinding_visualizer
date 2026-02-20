
#include "src/grid.hpp"
#include "src/grid_json.hpp"
#include <iostream>
#include <string>
using namespace std;


int main() {
    grid g;

    cout << gridToJson(g) << endl;
    
    return 0;
}
