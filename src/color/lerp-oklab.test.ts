import { expect, test } from "vitest";
import { lerpOklab, hexToRgba } from "./lerp-oklab";

// === lerpOklab ===

test("at progress 0 returns from color exactly", () => {
  const result = lerpOklab([1, 0, 0, 1], [0, 1, 0, 0.5], 0);
  expect(result[0]).toBeCloseTo(1, 5);
  expect(result[1]).toBeCloseTo(0, 5);
  expect(result[2]).toBeCloseTo(0, 5);
  expect(result[3]).toBeCloseTo(1, 5);
});

test("at progress 1 returns to color exactly", () => {
  const result = lerpOklab([1, 0, 0, 1], [0, 1, 0, 0.5], 1);
  expect(result[0]).toBeCloseTo(0, 3);
  expect(result[1]).toBeCloseTo(1, 3);
  expect(result[2]).toBeCloseTo(0, 3);
  expect(result[3]).toBeCloseTo(0.5, 3);
});

test("alpha lerps linearly", () => {
  const from: [number, number, number, number] = [1, 0, 0, 0];
  const to: [number, number, number, number] = [0, 1, 0, 1];

  const mid = lerpOklab(from, to, 0.5);
  expect(mid[3]).toBeCloseTo(0.5, 5);

  const quarter = lerpOklab(from, to, 0.25);
  expect(quarter[3]).toBeCloseTo(0.25, 5);
});

test("red to blue produces purple-ish mid", () => {
  const result = lerpOklab([1, 0, 0, 1], [0, 0, 1, 1], 0.5);
  // Midpoint should be purple-ish — both R and B present, G is secondary
  expect(result[0]).toBeGreaterThan(0.3);
  expect(result[2]).toBeGreaterThan(0.3);
  // G should be lower than the max of R and B
  expect(result[1]).toBeLessThan(Math.max(result[0], result[2]));
});

test("Oklab avoids muddy brown mid (red to green)", () => {
  // In RGB, red→green midpoint is muddy brown (~128, 128, 0).
  // Oklab should pass through a brighter, more yellow mid.
  const result = lerpOklab([1, 0, 0, 1], [0, 1, 0, 1], 0.5);
  // At least one channel should be bright — not all mid
  const maxChannel = Math.max(result[0], result[1], result[2]);
  expect(maxChannel).toBeGreaterThan(0.5);
});

test("returns 4-element tuple", () => {
  const result = lerpOklab([1, 1, 1, 1], [0, 0, 0, 1], 0.5);
  expect(result).toHaveLength(4);
  result.forEach((v) => expect(typeof v).toBe("number"));
});

test("clamps progress outside [0, 1]", () => {
  const from: [number, number, number, number] = [1, 0, 0, 1];
  const to: [number, number, number, number] = [0, 1, 0, 0];

  // Negative progress clamps to 0
  const clampedStart = lerpOklab(from, to, -0.5);
  expect(clampedStart[0]).toBeCloseTo(from[0], 3);
  expect(clampedStart[3]).toBeCloseTo(from[3], 3);

  // Over-1 progress clamps to 1
  const clampedEnd = lerpOklab(from, to, 1.5);
  expect(clampedEnd[0]).toBeCloseTo(to[0], 3);
  expect(clampedEnd[3]).toBeCloseTo(to[3], 3);
});

// === hexToRgba ===

test("parses #RRGGBB", () => {
  const result = hexToRgba("#ff8040");
  expect(result[0]).toBeCloseTo(1, 2);
  expect(result[1]).toBeCloseTo(128 / 255, 2);
  expect(result[2]).toBeCloseTo(64 / 255, 2);
  expect(result[3]).toBe(1);
});

test("parses #RRGGBBAA", () => {
  const result = hexToRgba("#ff000080");
  expect(result[0]).toBeCloseTo(1, 2);
  expect(result[1]).toBeCloseTo(0, 2);
  expect(result[2]).toBeCloseTo(0, 2);
  expect(result[3]).toBeCloseTo(128 / 255, 2);
});

test("parses #RGB shorthand", () => {
  const result = hexToRgba("#f80");
  expect(result[0]).toBeCloseTo(1, 2);
  expect(result[1]).toBeCloseTo(136 / 255, 2);
  expect(result[2]).toBeCloseTo(0, 2);
  expect(result[3]).toBe(1);
});

test("parses #RGBA shorthand", () => {
  const result = hexToRgba("#f808");
  expect(result[0]).toBeCloseTo(1, 2);
  expect(result[1]).toBeCloseTo(136 / 255, 2);
  expect(result[2]).toBeCloseTo(0, 2);
  expect(result[3]).toBeCloseTo(136 / 255, 2);
});

test("parses hex without leading #", () => {
  const result = hexToRgba("00ff00");
  expect(result[0]).toBeCloseTo(0, 2);
  expect(result[1]).toBeCloseTo(1, 2);
  expect(result[2]).toBeCloseTo(0, 2);
  expect(result[3]).toBe(1);
});

test("returns black for invalid hex string", () => {
  const result = hexToRgba("xyz");
  expect(result[0]).toBe(0);
  expect(result[1]).toBe(0);
  expect(result[2]).toBe(0);
  expect(result[3]).toBe(1);
});

test("lerpOklab with hexToRgba inputs works end-to-end", () => {
  const from = hexToRgba("#ff0000");
  const to = hexToRgba("#0000ff");

  const mid = lerpOklab(from, to, 0.5);
  // Purple-ish midpoint
  expect(mid[0]).toBeGreaterThan(0.3);
  expect(mid[2]).toBeGreaterThan(0.3);
  expect(mid[3]).toBeCloseTo(1, 5);
});
