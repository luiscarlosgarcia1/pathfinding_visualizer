# Architecture Overview

## Purpose
This project is a modular pathfinding laboratory designed to explore algorithmic behavior, performance tradeoffs, and system design across multiple layers and tools.  
The primary goals are:
- Deepen understanding of pathfinding algorithms
- Compare correctness vs performance tradeoffs
- Practice clean software architecture
- Develop breadth across systems, tooling, and visualization
- Produce a portfolio-quality project suitable for internship review

---

## High-Level System Structure

The system is composed of four primary components:

1. **C++ Pathfinding Engine**
2. **Python Visualization Layer**
3. **Benchmarking & Data Pipeline**
4. **Web-Based Analysis Dashboard**

Each component is independently runnable and communicates through well-defined data contracts.

---

## Component Breakdown

### 1. C++ Pathfinding Engine
**Responsibility**
- Implement core pathfinding algorithms
- Perform performance-critical computation
- Serve as the source of truth for algorithm correctness and efficiency

**Key Characteristics**
- No UI code
- No visualization concerns
- Exposed via a command-line interface (CLI)
- Outputs structured JSON results

**Algorithms Implemented**
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra’s Algorithm
- A* Search

**Why C++**
- Explore low-level performance considerations
- Practice memory management and efficiency
- Enable realistic benchmarking
- Demonstrate systems-level competence

---

### 2. Python Visualization Layer (Pygame)
**Responsibility**
- Interactive visualization of pathfinding behavior
- Educational and exploratory interface
- Rapid iteration and experimentation

**Key Characteristics**
- No algorithm logic duplicated from the engine
- Consumes algorithm state or precomputed results
- Focused on clarity, not performance

**Why Python**
- Fast development cycle
- Clear expression of logic
- Strong ecosystem for visualization
- Complements C++ performance focus

---

### 3. Benchmarking & Data Pipeline
**Responsibility**
- Execute algorithms under controlled conditions
- Collect and normalize performance metrics
- Store results in a reproducible format

**Metrics Collected**
- Runtime
- Nodes expanded
- Path length
- Grid size and obstacle density

**Data Format**
- JSON with a fixed schema
- Identical structure regardless of algorithm

**Design Goal**
Enable fair, repeatable comparisons between algorithms and configurations.

---

### 4. Web-Based Analysis Dashboard (React)
**Responsibility**
- Visualize benchmark results
- Compare algorithms across metrics
- Present performance trends clearly

**Key Characteristics**
- No algorithm execution
- Consumes JSON benchmark data
- Focused on data interpretation and comparison

**Why React**
- Practice modern frontend development
- Build data-driven UIs
- Separate analysis from computation

---

## Data Flow

1. C++ engine executes an algorithm on a given grid
2. Engine outputs results as JSON
3. Benchmark tools aggregate and store results
4. Python visualizer or React dashboard consumes the data
5. Results are rendered visually for analysis

All communication between components occurs through files or defined interfaces, not direct language bindings.

---

## Architectural Boundaries (Non-Negotiable)

- Algorithms do not depend on UI code
- Visualization does not implement algorithm logic
- C++ engine does not depend on Python or JavaScript
- JSON schemas are treated as contracts
- Each component must be runnable independently

---

## Design Decisions

### Why Separate Engine and Visualization
- Prevents tight coupling
- Allows independent testing and benchmarking
- Enables language diversity without architectural debt

### Why JSON as the Interface
- Language-agnostic
- Easy to inspect and debug
- Stable contract for multiple consumers

### Why a Single Engine Language
- Avoids duplicated logic
- Enables deeper exploration of performance
- Keeps complexity intentional, not accidental

---

## Non-Goals

The following are explicitly out of scope:
- Real-time networking
- Authentication or user accounts
- Microservices or distributed systems
- GPU acceleration
- Production-grade UI polish

These are excluded to preserve focus on algorithmic and architectural learning.

---

## Growth & Skill Exploration Targets

This project is intentionally designed to explore:
- Software architecture and modular design
- Algorithm implementation and analysis
- Performance benchmarking
- CLI tool design
- Data serialization and contracts
- Visualization for engineering insight
- Containerization and CI/CD
- Cross-language system composition

---

## Future Extensions (Optional)

- Maze generation algorithms
- Additional heuristics for A*
- Headless benchmarking mode
- CSV export for offline analysis
- Visualization playback controls

All extensions must respect existing architectural boundaries.