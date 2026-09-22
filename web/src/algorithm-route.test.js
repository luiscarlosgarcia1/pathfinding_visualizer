import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses an algorithm name, rather than its engine code, for run requests", async () => {
  const appSource = await readFile(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /fetchRun\(layout, key\)/);
});
