import { expect, test } from "vitest";
import { cubicBezier } from "./easing";

test("cubicBezier(0, 0, 1, 1) is linear", () => {
  const ease = cubicBezier(0, 0, 1, 1);

  expect(ease(0)).toBeCloseTo(0, 5);
  expect(ease(0.25)).toBeCloseTo(0.25, 2);
  expect(ease(0.5)).toBeCloseTo(0.5, 2);
  expect(ease(0.75)).toBeCloseTo(0.75, 2);
  expect(ease(1)).toBeCloseTo(1, 5);
});

test("cubicBezier(0.42, 0, 0.58, 1) is ease-in-out", () => {
  const ease = cubicBezier(0.42, 0, 0.58, 1);

  expect(ease(0)).toBeCloseTo(0, 5);
  expect(ease(1)).toBeCloseTo(1, 5);
  // Ease-in-out: slow at edges, fast in the middle
  expect(ease(0.25)).toBeLessThan(0.25);
  expect(ease(0.75)).toBeGreaterThan(0.75);
});

test("clamps to 0 and 1 at edges", () => {
  const ease = cubicBezier(0.25, 0.1, 0.25, 1);

  expect(ease(-0.1)).toBe(0);
  expect(ease(1.5)).toBe(1);
});

test("ease-in: cubicBezier(0.42, 0, 1, 1) starts slow", () => {
  const easeIn = cubicBezier(0.42, 0, 1, 1);

  // At x=0.5, y hasn't caught up yet — starts slow
  expect(easeIn(0.5)).toBeLessThan(0.5);
  expect(easeIn(0.5)).toBeCloseTo(0.315, 1);
  expect(easeIn(1)).toBeCloseTo(1, 5);
});

test("ease-out: cubicBezier(0, 0, 0.58, 1) starts fast", () => {
  const easeOut = cubicBezier(0, 0, 0.58, 1);

  // At x=0.5, y is already ahead — starts fast
  expect(easeOut(0.5)).toBeGreaterThan(0.5);
  expect(easeOut(1)).toBeCloseTo(1, 5);
});

test("works with resolveEasing when passed as function", async () => {
  const { resolveEasing } = await import("./easing");
  const ease = resolveEasing(cubicBezier(0.25, 0.1, 0.25, 1));

  expect(ease(0)).toBeCloseTo(0, 5);
  expect(ease(0.5)).toBeGreaterThan(0.3);
  expect(ease(1)).toBeCloseTo(1, 5);
});

test("64 samples gives good enough accuracy", () => {
  // CSS ease-in-out — should be close to a known value at midpoint
  const ease = cubicBezier(0.42, 0, 0.58, 1);

  // At 64 samples, error should be under 0.002
  expect(Math.abs(ease(0.5) - 0.5)).toBeLessThan(0.005);
});
