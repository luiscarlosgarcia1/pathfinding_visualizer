
#include "algorithms/astar.hpp"
#include "algorithms/bfs.hpp"
#include "algorithms/dijkstra.hpp"
#include "algorithms/wilsons.hpp"
#include "serializers/v2_binary.hpp"
#include <chrono>
#include <cstdlib>
#include <iostream>
#include <string>

namespace {
bool parseUnsigned(const char* text, unsigned int& value) {
    if (text == nullptr || *text == '\0') return false;
    char* end = nullptr; const unsigned long parsed = std::strtoul(text, &end, 10);
    if (*end != '\0' || parsed > UINT_MAX) return false;
    value = static_cast<unsigned int>(parsed); return true;
}
bool parseAlgorithm(const std::string& text, v2::Algorithm& algorithm) {
    if (text == "bfs") { algorithm = v2::Algorithm::Bfs; return true; }
    if (text == "dijkstra") { algorithm = v2::Algorithm::Dijkstra; return true; }
    if (text == "astar") { algorithm = v2::Algorithm::Astar; return true; }
    return false;
}
bool parseDetail(const std::string& text, std::uint8_t& detail) {
    if (text == "full") { detail = v2::kFullRun; return true; }
    if (text == "metrics") { detail = v2::kMetricsRun; return true; }
    return false;
}
result execute(grid& layout, v2::Algorithm algorithm) {
    const auto started = std::chrono::steady_clock::now(); result run;
    if (algorithm == v2::Algorithm::Bfs) run = bfs(layout);
    else if (algorithm == v2::Algorithm::Dijkstra) run = dijkstra(layout);
    else run = astar(layout);
    run.algorithmRuntimeUs = std::chrono::duration_cast<std::chrono::microseconds>(std::chrono::steady_clock::now() - started).count();
    return run;
}
}  // namespace

int main(int argc, char* argv[]) {
    if (argc < 3) return 2;
    unsigned int seed = 0;
    if (!parseUnsigned(argv[2], seed)) return 2;
    grid layout; std::srand(seed); wilsons(layout);
    try {
        const std::string command = argv[1];
        if (command == "layout" && argc == 3) { v2::writeLayout(std::cout, layout); return std::cout ? 0 : 1; }
        if (command != "run" || argc != 5) return 2;
        v2::Algorithm algorithm; std::uint8_t detail = 0;
        if (!parseAlgorithm(argv[3], algorithm) || !parseDetail(argv[4], detail)) return 2;
        v2::writeRun(std::cout, layout, execute(layout, algorithm), algorithm, detail);
        return std::cout ? 0 : 1;
    } catch (const std::exception&) { return 1; }
}
