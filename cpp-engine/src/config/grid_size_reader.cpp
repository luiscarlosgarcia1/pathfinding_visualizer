#include "grid_size_reader.hpp"

#include <cctype>
#include <fstream>
#include <iterator>
#include <string>

namespace config {
int read_grid_size(const std::string& path)
{
    int fallback = 30;
    
    std::ifstream file(path);
    if (!file.is_open()) return fallback;

    std::string json((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    const std::string key = "\"grid_size\"";
    const size_t key_pos = json.find(key);
    if (key_pos == std::string::npos) return fallback;

    const size_t colon_pos = json.find(':', key_pos);
    if (colon_pos == std::string::npos) return fallback;

    size_t i = colon_pos + 1;
    while (i < json.size() && std::isspace(static_cast<unsigned char>(json[i]))) i++;

    size_t j = i;
    while (j < json.size() && std::isdigit(static_cast<unsigned char>(json[j]))) j++;
    if (i == j) return fallback;

    const int value = std::stoi(json.substr(i, j - i));
    return value > 1 ? value : fallback;
}
}  // namespace config
