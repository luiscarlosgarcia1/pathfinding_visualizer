#pragma once

#include "grid.hpp"

#include <array>
#include <cstdlib>
#include <vector>

namespace {
void carveWilsonPassage(grid& layout, int cell) {
    if (!layout.isStart(cell) && !layout.isEnd(cell)) layout.setEmpty(cell);
    layout.weights[cell] = 1 + std::rand() % 9;
}

int randomWilsonNeighbor(const grid& layout, int cell) {
    const int dimensions = layout.getGridDims();
    const int row = cell / dimensions;
    const int column = cell % dimensions;
    std::array<int, 4> neighbors;
    int count = 0;

    if (row > 1) neighbors[count++] = cell - 2 * dimensions;
    if (column + 2 < dimensions - 1) neighbors[count++] = cell + 2;
    if (row + 2 < dimensions - 1) neighbors[count++] = cell + 2 * dimensions;
    if (column > 1) neighbors[count++] = cell - 2;
    return neighbors[std::rand() % count];
}
}  // namespace

// Generates a perfect maze over the interior checkerboard lattice. The Grid's
// Start and End cells are lattice nodes, so the resulting tree connects them
// without opening the perimeter or adding a repair corridor.
inline void wilsons(grid& layout) {
    const int dimensions = layout.getGridDims();
    const int size = layout.getGridSize();
    std::vector<int> nodes;
    for (int row = 1; row < dimensions - 1; row += 2)
        for (int column = 1; column < dimensions - 1; column += 2)
            nodes.push_back(row * dimensions + column);

    std::vector<bool> inTree(size, false);
    std::vector<int> walkPosition(size, -1);
    inTree[layout.getStart()] = true;
    layout.weights[layout.getStart()] = 1;

    int remaining = static_cast<int>(nodes.size()) - 1;
    while (remaining > 0) {
        int start = nodes[std::rand() % nodes.size()];
        if (inTree[start]) continue;

        std::vector<int> walk;
        int current = start;
        while (!inTree[current]) {
            if (walkPosition[current] < 0) {
                walkPosition[current] = static_cast<int>(walk.size());
                walk.push_back(current);
            }
            const int next = randomWilsonNeighbor(layout, current);

            if (walkPosition[next] >= 0) {
                for (int index = walkPosition[next] + 1; index < static_cast<int>(walk.size()); ++index)
                    walkPosition[walk[index]] = -1;
                walk.resize(walkPosition[next] + 1);
            }
            current = next;
        }

        for (int index = 0; index < static_cast<int>(walk.size()); ++index) {
            const int cell = walk[index];
            carveWilsonPassage(layout, cell);
            const int next = index + 1 < static_cast<int>(walk.size()) ? walk[index + 1] : current;
            carveWilsonPassage(layout, (cell + next) / 2);
            inTree[cell] = true;
            walkPosition[cell] = -1;
            --remaining;
        }
    }
    layout.weights[layout.getEnd()] = 1;
}
