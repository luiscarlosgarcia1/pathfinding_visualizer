import assert from "node:assert/strict";
import test from "node:test";
import { app } from "./index.js";

const GRID_DIMENSIONS = 101;
const algorithms = ["bfs", "dijkstra", "astar"];
const details = ["full", "metrics"];

const readRun = async (response) => {
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    buffer,
    gridDims: buffer.readUInt32LE(8),
    gridSize: buffer.readUInt32LE(12),
    algorithm: buffer[16],
    detail: buffer[17],
    found: buffer[18],
    runtimeUs: Number(buffer.readBigUInt64LE(20)),
    totalDistance: buffer.readUInt32LE(28),
    visitCount: buffer.readUInt32LE(32),
    pathLength: buffer.readUInt32LE(36),
  };
};

test("public Layout and Pathfinding-run contracts use the fixed 101 by 101 Grid", async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  {
    const gridDims = GRID_DIMENSIONS;
    const layoutResponse = await fetch(`${baseUrl}/api/layout`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
    });
    assert.equal(layoutResponse.status, 200);
    assert.equal(layoutResponse.headers.get("content-type"), "application/octet-stream");
    const layoutId = layoutResponse.headers.get("x-layout-id");
    assert.ok(layoutId);
    const layout = Buffer.from(await layoutResponse.arrayBuffer());
    assert.equal(layout.subarray(0, 4).toString("ascii"), "WFL2");
    assert.equal(layout.readUInt32LE(8), gridDims);
    assert.equal(layout.readUInt32LE(12), gridDims * gridDims);
    assert.equal(layout.length, 16 + gridDims * gridDims * 2);

    for (const algorithm of algorithms) for (const detail of details) {
      const response = await fetch(`${baseUrl}/api/runs/${algorithm}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ layoutId, detail }),
      });
      assert.equal(response.status, 200, `${gridDims} ${algorithm} ${detail}`);
      assert.equal(response.headers.get("x-layout-id"), layoutId);
      const run = await readRun(response);
      assert.equal(run.buffer.subarray(0, 4).toString("ascii"), "WFR2");
      assert.equal(run.gridDims, gridDims);
      assert.equal(run.gridSize, gridDims * gridDims);
      assert.equal(run.algorithm, algorithms.indexOf(algorithm) + 1);
      assert.equal(run.detail, detail === "full" ? 1 : 2);
      assert.equal(run.found, 1, "generated layouts remain reachable");
      assert.ok(run.runtimeUs >= 0);
      assert.ok(run.totalDistance > 0);
      if (detail === "metrics") {
        assert.equal(run.visitCount, 0);
        assert.equal(run.pathLength, 0);
      } else {
        assert.ok(run.visitCount > 0);
        assert.ok(run.pathLength > 0, "successful full runs include a final path");
        assert.equal(run.buffer.length, 40 + (run.visitCount + run.pathLength) * 4);
        for (let offset = 40; offset < run.buffer.length; offset += 4) {
          assert.ok(run.buffer.readUInt32LE(offset) < run.gridSize);
        }
      }
    }
  }
});

test("public API reports binary-contract request failures explicitly", async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const invalidDimension = await fetch(`${baseUrl}/api/layout`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gridDims: 100 }),
  });
  assert.equal(invalidDimension.status, 400);
  assert.deepEqual(await invalidDimension.json(), { ok: false, error: "grid_dimensions_locked" });

  const staleRun = await fetch(`${baseUrl}/api/runs/bfs`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ layoutId: "obsolete", detail: "full" }),
  });
  assert.equal(staleRun.status, 409);
  assert.deepEqual(await staleRun.json(), { ok: false, error: "stale_layout_id" });
});
