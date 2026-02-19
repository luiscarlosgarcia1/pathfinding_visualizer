
#pragma once
#include "config/grid_size_reader.hpp"
#include <vector>

// struct Size { int width, height; };
// struct Pos { int row, col; };

enum class State {
    Empty,
    Wall,
    Start,
    End,
    Visited,
    Path,
    Line
};

//     constexpr State empty   {0, 0, 0};
//     constexpr State wall    {200, 200, 200};
//     constexpr State start   {0, 255, 0};
//     constexpr State end     {255, 0, 0};
//     constexpr State visited {100, 150, 255};
//     constexpr State path    {255, 165, 0};
//     constexpr State line    {50, 50, 50};

class grid
{
private:
    int grid_size;

    class cell
    {
    public:
        State state;
        cell (State st) 
        {
            state = st;
        }
    };
    std::vector<cell> cells;


public:
    grid() 
    {
        grid_size = config::read_grid_size("configs/config.json");

        cells.reserve(grid_size*grid_size);

        for (int i = 0; i < grid_size*grid_size; i++)
        {
            cells.emplace_back(State::Empty);
        }
    }
    ~grid() = default;
    
};
