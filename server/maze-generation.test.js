import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const engine = fileURLToPath(new URL("../cpp-engine/build/main", import.meta.url));
const states = { empty: 0, wall: 1, start: 2, end: 3 };

const readLayout = (gridDims, seed) => {
  const layout = execFileSync(engine, ["layout", String(gridDims), String(seed)]);
  assert.equal(layout.subarray(0, 4).toString("ascii"), "WFL2");
  assert.equal(layout.readUInt32LE(8), gridDims);

  return Array.from({ length: gridDims * gridDims }, (_, index) => layout[16 + index * 2]);
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

test("engine layouts are deterministic perfect mazes with interior terminals and solid perimeter walls", () => {
  for (const gridDims of [11, 12]) for (const seed of [0, 42, 8675309]) {
    const cells = readLayout(gridDims, seed);
    assert.deepEqual(cells, readLayout(gridDims, seed), `${gridDims}/${seed} is deterministic`);

    const passages = cells.filter((cell) => cell !== states.wall);
    assert.equal(cells.filter((cell) => cell === states.start).length, 1);
    assert.equal(cells.filter((cell) => cell === states.end).length, 1);
    const start = cells.indexOf(states.start);
    const end = cells.indexOf(states.end);
    const reached = reachablePassages(cells, gridDims, start);
    assert.ok(reached.has(end), `seed ${seed} connects Start to End`);
    assert.equal(reached.size, passages.length, `seed ${seed} has one connected passage network`);
    assert.equal(adjacentPassageEdges(cells, gridDims), passages.length - 1, `seed ${seed} has no loops`);

    for (let index = 0; index < cells.length; index += 1) {
      const row = Math.floor(index / gridDims);
      const column = index % gridDims;
      if (row === 0 || row === gridDims - 1 || column === 0 || column === gridDims - 1)
        assert.equal(cells[index], states.wall, `seed ${seed} keeps index ${index} on the perimeter closed`);
    }
  }
});
