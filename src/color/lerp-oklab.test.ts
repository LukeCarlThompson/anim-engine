import { expect, test } from "vitest";

import { lerpOklab, hexToRgba } from "./lerp-oklab";

// === lerpOklab ===

test("GIVEN two colors WHEN lerping at progress 0 THEN it returns the from color exactly", () => {
  // GIVEN / WHEN
  const result = lerpOklab([1, 0, 0, 1], [0, 1, 0, 0.5], 0);

  // THEN
  expect(result[0]).toBeCloseTo(1, 5);
  expect(result[1]).toBeCloseTo(0, 5);
  expect(result[2]).toBeCloseTo(0, 5);
  expect(result[3]).toBeCloseTo(1, 5);
});

test("GIVEN two colors WHEN lerping at progress 1 THEN it returns the to color exactly", () => {
  // GIVEN / WHEN
  const result = lerpOklab([1, 0, 0, 1], [0, 1, 0, 0.5], 1);

  // THEN
  expect(result[0]).toBeCloseTo(0, 3);
  expect(result[1]).toBeCloseTo(1, 3);
  expect(result[2]).toBeCloseTo(0, 3);
  expect(result[3]).toBeCloseTo(0.5, 3);
});

test("GIVEN two colors with different alpha values WHEN lerping THEN alpha interpolates linearly", () => {
  // GIVEN
  const from: [number, number, number, number] = [1, 0, 0, 0];
  const to: [number, number, number, number] = [0, 1, 0, 1];

  // WHEN / THEN
  const mid = lerpOklab(from, to, 0.5);
  expect(mid[3]).toBeCloseTo(0.5, 5);

  const quarter = lerpOklab(from, to, 0.25);
  expect(quarter[3]).toBeCloseTo(0.25, 5);
});

test("GIVEN red and blue colors WHEN lerping at midpoint THEN the result is purple-ish", () => {
  // GIVEN / WHEN
  const result = lerpOklab([1, 0, 0, 1], [0, 0, 1, 1], 0.5);

  // THEN — midpoint should be purple-ish
  expect(result[0]).toBeGreaterThan(0.3);
  expect(result[2]).toBeGreaterThan(0.3);
  expect(result[1]).toBeLessThan(Math.max(result[0], result[2]));
});

test("GIVEN red and green colors WHEN lerping with Oklab THEN it avoids a muddy brown midpoint", () => {
  // GIVEN / WHEN
  const result = lerpOklab([1, 0, 0, 1], [0, 1, 0, 1], 0.5);

  // THEN — at least one channel should be bright (not muddy)
  const maxChannel = Math.max(result[0], result[1], result[2]);
  expect(maxChannel).toBeGreaterThan(0.5);
});

test("GIVEN two colors WHEN lerping THEN it always returns a 4-element tuple of numbers", () => {
  // GIVEN / WHEN
  const result = lerpOklab([1, 1, 1, 1], [0, 0, 0, 1], 0.5);

  // THEN
  expect(result).toHaveLength(4);
  result.forEach((v) => expect(typeof v).toBe("number"));
});

test("GIVEN a progress value outside [0, 1] WHEN lerping THEN it clamps to the nearest bound", () => {
  // GIVEN
  const from: [number, number, number, number] = [1, 0, 0, 1];
  const to: [number, number, number, number] = [0, 1, 0, 0];

  // WHEN — negative progress
  const clampedStart = lerpOklab(from, to, -0.5);

  // THEN — clamped to 0
  expect(clampedStart[0]).toBeCloseTo(from[0], 3);
  expect(clampedStart[3]).toBeCloseTo(from[3], 3);

  // WHEN — over-1 progress
  const clampedEnd = lerpOklab(from, to, 1.5);

  // THEN — clamped to 1
  expect(clampedEnd[0]).toBeCloseTo(to[0], 3);
  expect(clampedEnd[3]).toBeCloseTo(to[3], 3);
});

// === hexToRgba ===

test("GIVEN a #RRGGBB hex string WHEN parsed THEN it returns the correct RGBA values", () => {
  // GIVEN / WHEN
  const result = hexToRgba("#ff8040");

  // THEN
  expect(result[0]).toBeCloseTo(1, 2);
  expect(result[1]).toBeCloseTo(128 / 255, 2);
  expect(result[2]).toBeCloseTo(64 / 255, 2);
  expect(result[3]).toBe(1);
});

test("GIVEN a #RRGGBBAA hex string WHEN parsed THEN it returns the correct RGBA values", () => {
  // GIVEN / WHEN
  const result = hexToRgba("#ff000080");

  // THEN
  expect(result[0]).toBeCloseTo(1, 2);
  expect(result[1]).toBeCloseTo(0, 2);
  expect(result[2]).toBeCloseTo(0, 2);
  expect(result[3]).toBeCloseTo(128 / 255, 2);
});

test("GIVEN a #RGB shorthand hex string WHEN parsed THEN it returns the correct RGBA values", () => {
  // GIVEN / WHEN
  const result = hexToRgba("#f80");

  // THEN
  expect(result[0]).toBeCloseTo(1, 2);
  expect(result[1]).toBeCloseTo(136 / 255, 2);
  expect(result[2]).toBeCloseTo(0, 2);
  expect(result[3]).toBe(1);
});

test("GIVEN a #RGBA shorthand hex string WHEN parsed THEN it returns the correct RGBA values", () => {
  // GIVEN / WHEN
  const result = hexToRgba("#f808");

  // THEN
  expect(result[0]).toBeCloseTo(1, 2);
  expect(result[1]).toBeCloseTo(136 / 255, 2);
  expect(result[2]).toBeCloseTo(0, 2);
  expect(result[3]).toBeCloseTo(136 / 255, 2);
});

test("GIVEN a hex string without leading # WHEN parsed THEN it returns the correct RGBA values", () => {
  // GIVEN / WHEN
  const result = hexToRgba("00ff00");

  // THEN
  expect(result[0]).toBeCloseTo(0, 2);
  expect(result[1]).toBeCloseTo(1, 2);
  expect(result[2]).toBeCloseTo(0, 2);
  expect(result[3]).toBe(1);
});

test("GIVEN an invalid hex string WHEN parsed THEN it returns black with full opacity", () => {
  // GIVEN / WHEN
  const result = hexToRgba("xyz");

  // THEN
  expect(result[0]).toBe(0);
  expect(result[1]).toBe(0);
  expect(result[2]).toBe(0);
  expect(result[3]).toBe(1);
});

test("GIVEN two hex colors parsed via hexToRgba WHEN lerping with lerpOklab THEN it works end-to-end", () => {
  // GIVEN
  const from = hexToRgba("#ff0000");
  const to = hexToRgba("#0000ff");

  // WHEN
  const mid = lerpOklab(from, to, 0.5);

  // THEN — purple-ish midpoint
  expect(mid[0]).toBeGreaterThan(0.3);
  expect(mid[2]).toBeGreaterThan(0.3);
  expect(mid[3]).toBeCloseTo(1, 5);
});
