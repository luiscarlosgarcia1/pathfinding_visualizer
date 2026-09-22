import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const engine = fileURLToPath(new URL("../cpp-engine/build/main", import.meta.url));
const states = { empty: 0, wall: 1, start: 2, end: 3 };

const GRID_DIMENSIONS = 101;

const readLayout = (seed) => {
  const layout = execFileSync(engine, ["layout", String(seed)]);
  assert.equal(layout.subarray(0, 4).toString("ascii"), "WFL2");
  assert.equal(layout.readUInt32LE(8), GRID_DIMENSIONS);

  return Array.from({ length: GRID_DIMENSIONS * GRID_DIMENSIONS }, (_, index) => ({
    state: layout[16 + index * 2],
    weight: layout[16 + index * 2 + 1],
  }));
};

const readRun = (seed, algorithm) => {
  const run = execFileSync(engine, ["run", String(seed), algorithm, "full"]);
  assert.equal(run.subarray(0, 4).toString("ascii"), "WFR2");

  const visitCount = run.readUInt32LE(32);
  const pathCount = run.readUInt32LE(36);
  const pathOffset = 40 + visitCount * 4;
  return {
    visitCount,
    totalDistance: run.readUInt32LE(28),
    path: Array.from({ length: pathCount }, (_, index) => run.readUInt32LE(pathOffset + index * 4)),
  };
};

const adjacentPassageEdges = (cells, gridDims) => {
  let edges = 0;
  for (let index = 0; index < cells.length; index += 1) {
    if (cells[index] === states.wall) continue;
    if (index % gridDims + 1 < gridDims && cells[index + 1] !== states.wall) edges += 1;
    if (index + gridDims < cells.length && cells[index + gridDims] !== states.wall) edges += 1;
  }
  return edges;
};

const reachablePassages = (cells, gridDims, start) => {
  const reached = new Set([start]);
  const pending = [start];
  while (pending.length > 0) {
    const cell = pending.shift();
    for (const offset of [-gridDims, 1, gridDims, -1]) {
      const neighbor = cell + offset;
      if (neighbor < 0 || neighbor >= cells.length) continue;
      if ((offset === 1 || offset === -1) && Math.floor(neighbor / gridDims) !== Math.floor(cell / gridDims)) continue;
      if (cells[neighbor] !== states.wall && !reached.has(neighbor)) {
        reached.add(neighbor);
        pending.push(neighbor);
      }
    }
  }
  return reached;
};

test("engine layouts are deterministic mazes with alternate interior routes and solid perimeter walls", () => {
  for (const seed of [0, 42, 8675309]) {
    const layout = readLayout(seed);
    const cells = layout.map(({ state }) => state);
    assert.deepEqual(layout, readLayout(seed), `${GRID_DIMENSIONS}/${seed} is deterministic`);

    const passages = cells.filter((cell) => cell !== states.wall);
    const wallCount = cells.length - passages.length;
    assert.equal(cells.filter((cell) => cell === states.start).length, 1);
    assert.equal(cells.filter((cell) => cell === states.end).length, 1);
    const start = cells.indexOf(states.start);
    const end = cells.indexOf(states.end);
    const reached = reachablePassages(cells, GRID_DIMENSIONS, start);
    assert.ok(reached.has(end), `seed ${seed} connects Start to End`);
    assert.equal(reached.size, passages.length, `seed ${seed} has one connected passage network`);
    assert.ok(adjacentPassageEdges(cells, GRID_DIMENSIONS) > passages.length - 1, `seed ${seed} has alternate routes`);
    assert.ok(wallCount >= cells.length * 0.45, `seed ${seed} retains a maze-like wall density`);

    for (let index = 0; index < cells.length; index += 1) {
      const row = Math.floor(index / GRID_DIMENSIONS);
      const column = index % GRID_DIMENSIONS;
      if (row === 0 || row === GRID_DIMENSIONS - 1 || column === 0 || column === GRID_DIMENSIONS - 1)
        assert.equal(cells[index], states.wall, `seed ${seed} keeps index ${index} on the perimeter closed`);
    }
  }
});

test("generated layouts use visibly frequent rough terrain", () => {
  const layout = readLayout(42);
  const passageCount = layout.filter(({ state }) => state !== states.wall).length;
  const roughTerrainCount = layout.filter(({ state, weight }) => state === states.empty && weight === 6).length;

  assert.ok(
    roughTerrainCount >= passageCount * 0.1,
    `expected at least 10% rough terrain, got ${roughTerrainCount}/${passageCount}`,
  );
});

test("A* explores materially fewer cells than BFS on a high-density generated Grid", () => {
  const bfsRun = readRun(42, "bfs");
  const astarRun = readRun(42, "astar");

  assert.ok(
    astarRun.visitCount <= bfsRun.visitCount * 0.8,
    `A* should visit at most 80% of BFS cells, got ${astarRun.visitCount}/${bfsRun.visitCount}`,
  );
});

test("BFS reports the weighted distance of its fewest-step path", () => {
  const layout = readLayout(42);
  const bfsRun = readRun(42, "bfs");

  const expectedDistance = bfsRun.path
    .slice(1)
    .reduce((distance, index) => distance + Math.max(1, layout[index].weight), 0);

  assert.equal(bfsRun.totalDistance, expectedDistance);
});

test("Dijkstra's weighted path cost is no greater than BFS's", () => {
  const bfsRun = readRun(42, "bfs");
  const dijkstraRun = readRun(42, "dijkstra");

  assert.ok(dijkstraRun.totalDistance <= bfsRun.totalDistance, "Dijkstra should not cost more than BFS's route");
});
