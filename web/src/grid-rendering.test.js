import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses Canvas as the only Grid presentation", async () => {
  const appSource = await readFile(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /<CanvasGrid layout=\{layout\} run=\{run\}/);
  assert.doesNotMatch(appSource, /className="grid"/);
  assert.doesNotMatch(appSource, /gridcell/);
});

test("renders a safe Canvas label while the initial Layout is loading", async () => {
  const appSource = await readFile(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /const label = layout\s*\?/);
  assert.match(appSource, /"Pathfinding canvas loading"/);
  assert.match(appSource, /aria-label=\{label\}/);
});

test("keeps both Grid presentations square at their outer edges", async () => {
  const styles = await readFile(new URL("./App.css", import.meta.url), "utf8");

  for (const selector of [".canvas-presentation"]) {
    const rule = styles.match(new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([\\s\\S]*?)\\}`));

    assert.ok(rule, `${selector} must have a style rule`);
    assert.doesNotMatch(rule[1], /border-radius\s*:/, `${selector} must not round or clip the Grid's corner cells`);
  }
});

test("paints high-density path cells without stroking across walls", async () => {
  const appSource = await readFile(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(
    appSource,
    /run\.path\.forEach\([\s\S]*?context\.fillRect/,
    "the canvas must paint each path cell independently",
  );
  assert.doesNotMatch(appSource, /context\.stroke\(\)/, "the canvas must not stroke a path over neighboring wall cells");
});
