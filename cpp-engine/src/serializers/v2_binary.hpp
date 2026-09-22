#pragma once

#include "algorithms/result.hpp"
#include "grid.hpp"

#include <cstdint>
#include <cstdlib>
#include <deque>
#include <limits>
#include <ostream>
#include <stdexcept>
#include <type_traits>
#include <vector>

namespace v2 {
constexpr std::uint16_t kVersion = 2;
constexpr std::uint16_t kLayoutEnvelope = 1;
constexpr std::uint16_t kRunEnvelope = 2;
constexpr std::uint8_t kFullRun = 1;
constexpr std::uint8_t kMetricsRun = 2;
enum class Algorithm : std::uint8_t { Bfs = 1, Dijkstra = 2, Astar = 3 };

template <typename T>
inline void write(std::ostream& out, T value) {
    static_assert(std::is_integral<T>::value, "binary fields must be integral");
    for (std::size_t byte = 0; byte < sizeof(T); ++byte)
        out.put(static_cast<char>((value >> (byte * 8)) & 0xff));
}

inline void writeMagic(std::ostream& out, const char (&magic)[5]) { out.write(magic, 4); }

inline bool validLayout(const grid& layout) {
    const int size = layout.getGridSize();
    return layout.getGridDims() == grid::kDimensions &&
        static_cast<int>(layout.getCells().size()) == size &&
        static_cast<int>(layout.getWeights().size()) == size &&
        layout.isStart(layout.getStart()) && layout.isEnd(layout.getEnd());
}

inline bool validPath(const grid& layout, const result& run) {
    if (!run.found) return run.path.empty();
    if (run.path.empty() || run.path.front() != layout.getStart() || run.path.back() != layout.getEnd()) return false;
    for (std::size_t i = 1; i < run.path.size(); ++i) {
        const int prior = run.path[i - 1], current = run.path[i];
        const int row = std::abs(prior / layout.getGridDims() - current / layout.getGridDims());
        const int column = std::abs(prior % layout.getGridDims() - current % layout.getGridDims());
        if (row + column != 1) return false;
    }
    return true;
}

inline void writeLayout(std::ostream& out, const grid& layout) {
    if (!validLayout(layout)) throw std::invalid_argument("invalid Layout");
    writeMagic(out, "WFL2"); write<std::uint16_t>(out, kVersion); write<std::uint16_t>(out, kLayoutEnvelope);
    write<std::uint32_t>(out, layout.getGridDims()); write<std::uint32_t>(out, layout.getGridSize());
    for (int index = 0; index < layout.getGridSize(); ++index) {
        write<std::uint8_t>(out, static_cast<std::uint8_t>(layout.getCells()[index]));
        const int weight = layout.getWeights()[index];
        if (weight < 1 || weight > std::numeric_limits<std::uint8_t>::max()) throw std::invalid_argument("invalid weight");
        write<std::uint8_t>(out, static_cast<std::uint8_t>(weight));
    }
}

inline void writeRun(std::ostream& out, const grid& layout, const result& run, Algorithm algorithm, std::uint8_t detail) {
    if (!validLayout(layout) || !validPath(layout, run)) throw std::invalid_argument("invalid Pathfinding run");
    if (detail != kFullRun && detail != kMetricsRun) throw std::invalid_argument("unknown run detail");
    const std::vector<int> empty;
    const std::vector<int>& visits = detail == kFullRun ? run.visitOrder : empty;
    writeMagic(out, "WFR2"); write<std::uint16_t>(out, kVersion); write<std::uint16_t>(out, kRunEnvelope);
    write<std::uint32_t>(out, layout.getGridDims()); write<std::uint32_t>(out, layout.getGridSize());
    write<std::uint8_t>(out, static_cast<std::uint8_t>(algorithm)); write<std::uint8_t>(out, detail);
    write<std::uint8_t>(out, run.found ? 1 : 0); write<std::uint8_t>(out, 0);
    write<std::uint64_t>(out, static_cast<std::uint64_t>(run.algorithmRuntimeUs));
    write<std::uint32_t>(out, static_cast<std::uint32_t>(run.totalDist));
    write<std::uint32_t>(out, static_cast<std::uint32_t>(visits.size())); write<std::uint32_t>(out, detail == kFullRun ? static_cast<std::uint32_t>(run.path.size()) : 0);
    for (int index : visits) write<std::uint32_t>(out, static_cast<std::uint32_t>(index));
    if (detail == kFullRun) for (int index : run.path) write<std::uint32_t>(out, static_cast<std::uint32_t>(index));
}
}  // namespace v2
