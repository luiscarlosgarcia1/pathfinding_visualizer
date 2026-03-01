CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -pedantic -I. -Icpp-engine -Icpp-engine/src

SRC := \
	cpp-engine/main.cpp \
	cpp-engine/src/grid.cpp \
	cpp-engine/src/config/grid_size_reader.cpp \
	cpp-engine/src/algorithms/bfs/bfs.cpp \
	cpp-engine/src/algorithms/prims/maze_gen.cpp \
	cpp-engine/src/serializers/grid_json.cpp \
	cpp-engine/src/serializers/bfs_json.cpp

BIN := cpp-engine/build/main

.PHONY: all run clean

all: $(BIN)

$(BIN): $(SRC)
	mkdir -p cpp-engine/build
	$(CXX) $(CXXFLAGS) $(SRC) -o $(BIN)

run: $(BIN)
	./$(BIN)

clean:
	rm -f $(BIN)
