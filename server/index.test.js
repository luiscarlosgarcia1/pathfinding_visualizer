import assert from "node:assert/strict";
import test from "node:test";
import { validateRunEnvelope } from "./index.js";

const expectedGrid = { gridDims: 11, gridSize: 121 };

const createRunEnvelope = ({ algorithm = 1, detail = 1, found = 1, visits = [0], path = [0] } = {}) => {
  const buffer = Buffer.alloc(40 + (visits.length + path.length) * 4);
  buffer.write("WFR2", 0, "ascii");
  buffer.writeUInt16LE(2, 4);
  buffer.writeUInt16LE(2, 6);
  buffer.writeUInt32LE(expectedGrid.gridDims, 8);
  buffer.writeUInt32LE(expectedGrid.gridSize, 12);
  buffer[16] = algorithm;
  buffer[17] = detail;
  buffer[18] = found;
  buffer.writeUInt32LE(visits.length, 32);
  buffer.writeUInt32LE(path.length, 36);
  [...visits, ...path].forEach((index, position) => buffer.writeUInt32LE(index, 40 + position * 4));
  return buffer;
};

test("validateRunEnvelope accepts a requested algorithm's in-grid full run", () => {
  assert.doesNotThrow(() => validateRunEnvelope(createRunEnvelope(), expectedGrid, "bfs"));
});

test("validateRunEnvelope rejects a run for a different algorithm", () => {
  assert.throws(() => validateRunEnvelope(createRunEnvelope({ algorithm: 2 }), expectedGrid, "bfs"));
});

test("validateRunEnvelope rejects out-of-grid visit and path indexes", () => {
  assert.throws(() => validateRunEnvelope(createRunEnvelope({ visits: [121] }), expectedGrid, "bfs"));
  assert.throws(() => validateRunEnvelope(createRunEnvelope({ path: [121] }), expectedGrid, "bfs"));
});

test("validateRunEnvelope rejects inconsistent full-run found and path values", () => {
  assert.throws(() => validateRunEnvelope(createRunEnvelope({ found: 0, path: [0] }), expectedGrid, "bfs"));
  assert.throws(() => validateRunEnvelope(createRunEnvelope({ found: 1, path: [] }), expectedGrid, "bfs"));
});
