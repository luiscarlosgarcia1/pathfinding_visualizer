import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGridDimensionInput } from "./grid-dimension-input.js";

test("preserves an empty Grid dimension while a user replaces its value", () => {
  assert.equal(normalizeGridDimensionInput("", 317), "");
});

test("accepts typed dimensions and caps values at the supported maximum", () => {
  assert.equal(normalizeGridDimensionInput("77", 317), 77);
  assert.equal(normalizeGridDimensionInput("318", 317), 317);
});
