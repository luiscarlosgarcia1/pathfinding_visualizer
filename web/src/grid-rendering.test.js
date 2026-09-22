import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("binds the current Grid dimension to the DOM grid column count", async () => {
  const appSource = await readFile(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(
    appSource,
    /className="grid"[^>]*style=\{\{\s*"--grid-columns":\s*gridColumns\s*\}\}/,
    "the DOM grid must set --grid-columns from the current Grid dimension",
  );
});

test("uses a Grid column fallback before the initial Layout loads", async () => {
  const appSource = await readFile(new URL("./App.jsx", import.meta.url), "utf8");

  assert.match(
    appSource,
    /const gridColumns = layout\?\.gridDims \?\? DEFAULT_GRID_SIZE;/,
    "the initial render must not read gridDims from a null Layout",
  );
});

test("keeps both Grid presentations square at their outer edges", async () => {
  const styles = await readFile(new URL("./App.css", import.meta.url), "utf8");

  for (const selector of [".grid", ".canvas-presentation"]) {
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
