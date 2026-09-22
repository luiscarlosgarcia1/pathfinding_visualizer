import assert from "node:assert/strict";
import test from "node:test";
import { CELL_ROLE, decodeLayout, decodeRun, fetchRun, generateLayout, GRID_DIMENSIONS } from "./wayfinder-client.js";

const GRID_SIZE = GRID_DIMENSIONS * GRID_DIMENSIONS;

const layoutEnvelope = () => {
  const buffer = new ArrayBuffer(16 + GRID_SIZE * 2); const view = new DataView(buffer);
  ["W", "F", "L", "2"].forEach((char, index) => view.setUint8(index, char.charCodeAt(0)));
  view.setUint16(4, 2, true); view.setUint16(6, 1, true); view.setUint32(8, GRID_DIMENSIONS, true); view.setUint32(12, GRID_SIZE, true);
  for (let index = 0; index < GRID_SIZE; index += 1) { view.setUint8(16 + index * 2, CELL_ROLE.EMPTY); view.setUint8(17 + index * 2, 1); }
  view.setUint8(16 + 102 * 2, CELL_ROLE.START); view.setUint8(16 + (GRID_SIZE - 103) * 2, CELL_ROLE.END); return buffer;
};
const runEnvelope = () => {
  const buffer = new ArrayBuffer(48); const view = new DataView(buffer);
  ["W", "F", "R", "2"].forEach((char, index) => view.setUint8(index, char.charCodeAt(0)));
  view.setUint16(4, 2, true); view.setUint16(6, 2, true); view.setUint32(8, GRID_DIMENSIONS, true); view.setUint32(12, GRID_SIZE, true);
  view.setUint8(16, 1); view.setUint8(17, 1); view.setUint8(18, 1); view.setBigUint64(20, 24n, true); view.setUint32(28, 4, true); view.setUint32(32, 1, true); view.setUint32(36, 1, true); view.setUint32(40, 102, true); view.setUint32(44, GRID_SIZE - 103, true); return buffer;
};

test("decodes binary Layouts and full runs into typed models", () => {
  const layout = decodeLayout(layoutEnvelope(), "layout-a"); const run = decodeRun(runEnvelope(), layout, 1);
  assert.ok(layout.roles instanceof Uint8Array); assert.ok(layout.weights instanceof Uint8Array); assert.ok(run.visitOrder instanceof Uint32Array); assert.ok(run.path instanceof Uint32Array);
  assert.equal(run.path[0], GRID_SIZE - 103);
});
test("rejects malformed envelopes", () => {
  assert.throws(() => decodeLayout(new ArrayBuffer(16), "layout-a"));
  const layout = decodeLayout(layoutEnvelope(), "layout-a"); assert.throws(() => decodeRun(runEnvelope().slice(0, 44), layout, 1));
});
test("refreshes the Layout instead of returning a stale run", async () => {
  const requests = [];
  const response = (status, body, headers = {}) => ({ status, ok: status >= 200 && status < 300, headers: new Headers(headers), arrayBuffer: async () => body, json: async () => ({ error: "stale_layout_id" }) });
  const request = async (url) => { requests.push(url); return url === "/api/layout" ? response(200, layoutEnvelope(), { "X-Layout-Id": "layout-b" }) : response(409, new ArrayBuffer(0)); };
  const result = await fetchRun(decodeLayout(layoutEnvelope(), "layout-a"), "bfs", request);
  assert.equal(result.stale, true); assert.equal(result.layout.id, "layout-b"); assert.deepEqual(requests, ["/api/runs/bfs", "/api/layout"]);
});

test("decodes a successful named-algorithm Pathfinding run", async () => {
  const layout = decodeLayout(layoutEnvelope(), "layout-a");
  const response = {
    status: 200,
    ok: true,
    headers: new Headers({ "X-Layout-Id": "layout-a" }),
    arrayBuffer: async () => runEnvelope(),
  };
  const result = await fetchRun(layout, "bfs", async () => response);

  assert.equal(result.stale, false);
  assert.equal(result.run.algorithm, 1);
});

test("requests a generated Layout without a dimension override", async () => {
  let request;
  const response = { ok: true, headers: new Headers({ "X-Layout-Id": "layout-c" }), arrayBuffer: async () => layoutEnvelope() };
  const layout = await generateLayout(async (...args) => { request = args; return response; });
  assert.equal(layout.gridDims, GRID_DIMENSIONS);
  assert.equal(request[0], "/api/layout");
  assert.equal(request[1].method, "POST");
  assert.deepEqual(JSON.parse(request[1].body), {});
});
