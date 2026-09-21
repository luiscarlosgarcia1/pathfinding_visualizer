import assert from "node:assert/strict";
import test from "node:test";
import { CELL_ROLE, decodeLayout, decodeRun, fetchRun, generateLayout, GRID_DIMENSIONS } from "./wayfinder-client.js";

const layoutEnvelope = () => {
  const buffer = new ArrayBuffer(16 + 121 * 2); const view = new DataView(buffer);
  ["W", "F", "L", "2"].forEach((char, index) => view.setUint8(index, char.charCodeAt(0)));
  view.setUint16(4, 2, true); view.setUint16(6, 1, true); view.setUint32(8, 11, true); view.setUint32(12, 121, true);
  for (let index = 0; index < 121; index += 1) { view.setUint8(16 + index * 2, CELL_ROLE.EMPTY); view.setUint8(17 + index * 2, 1); }
  view.setUint8(16 + 2 * 2, CELL_ROLE.START); view.setUint8(16 + 118 * 2, CELL_ROLE.END); return buffer;
};
const runEnvelope = () => {
  const buffer = new ArrayBuffer(48); const view = new DataView(buffer);
  ["W", "F", "R", "2"].forEach((char, index) => view.setUint8(index, char.charCodeAt(0)));
  view.setUint16(4, 2, true); view.setUint16(6, 2, true); view.setUint32(8, 11, true); view.setUint32(12, 121, true);
  view.setUint8(16, 1); view.setUint8(17, 1); view.setUint8(18, 1); view.setBigUint64(20, 24n, true); view.setUint32(28, 4, true); view.setUint32(32, 1, true); view.setUint32(36, 1, true); view.setUint32(40, 2, true); view.setUint32(44, 118, true); return buffer;
};

test("decodes binary Layouts and full runs into typed models", () => {
  const layout = decodeLayout(layoutEnvelope(), "layout-a"); const run = decodeRun(runEnvelope(), layout, 1);
  assert.ok(layout.roles instanceof Uint8Array); assert.ok(layout.weights instanceof Uint8Array); assert.ok(run.visitOrder instanceof Uint32Array); assert.ok(run.path instanceof Uint32Array);
  assert.equal(run.path[0], 118);
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

test("requests a generated Layout at the selected Grid dimension", async () => {
  let request;
  const response = { ok: true, headers: new Headers({ "X-Layout-Id": "layout-c" }), arrayBuffer: async () => layoutEnvelope() };
  const layout = await generateLayout(21, async (...args) => { request = args; return response; });
  assert.equal(layout.gridDims, 11);
  assert.equal(request[0], "/api/layout");
  assert.equal(request[1].method, "POST");
  assert.deepEqual(JSON.parse(request[1].body), { gridDims: 21 });
});

test("uses the documented Grid dimension range when generating Layouts", async () => {
  await assert.rejects(generateLayout(GRID_DIMENSIONS.min - 1), /between 11 and 317/);
  await assert.rejects(generateLayout(GRID_DIMENSIONS.max + 1), /between 11 and 317/);
});
