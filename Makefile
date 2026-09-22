CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -pedantic -I. -Icpp-engine -Icpp-engine/src

SRC := \
	cpp-engine/main.cpp \
	cpp-engine/src/grid.cpp

HEADERS := $(shell find cpp-engine/src -type f -name '*.hpp')

BIN := cpp-engine/build/main

.PHONY: all run clean

all: $(BIN)

$(BIN): $(SRC) $(HEADERS)
	mkdir -p cpp-engine/build
	$(CXX) $(CXXFLAGS) $(SRC) -o $(BIN)

run: $(BIN)
	./$(BIN)

clean:
	rm -f $(BIN)
