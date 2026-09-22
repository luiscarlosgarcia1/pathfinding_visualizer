import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("displays algorithms as performance-table columns", async () => {
  const component = await readFile(new URL("./algorithm-performance.jsx", import.meta.url), "utf8");

  assert.match(component, /algorithms\.map\(\(\{ key, label \}\) => <th key=\{key\} scope="col">\{label\}<\/th>\)/);
  assert.match(component, /METRICS\.map\(\(metric\) =>/);
});

test("uses a dedicated, wrapping run status area", async () => {
  const styles = await readFile(new URL("./algorithm-performance.css", import.meta.url), "utf8");

  assert.match(styles, /\.algorithm-performance__status p\s*\{[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(styles, /text-overflow:\s*ellipsis/);
});
