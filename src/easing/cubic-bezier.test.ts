import { expect, test } from "vitest";

import { cubicBezier } from "./easing";

test("GIVEN control points (0, 0, 1, 1) WHEN evaluating the cubic bezier THEN it behaves linearly", () => {
  // GIVEN
  const ease = cubicBezier(0, 0, 1, 1);

  // WHEN / THEN
  expect(ease(0)).toBeCloseTo(0, 5);
  expect(ease(0.25)).toBeCloseTo(0.25, 2);
  expect(ease(0.5)).toBeCloseTo(0.5, 2);
  expect(ease(0.75)).toBeCloseTo(0.75, 2);
  expect(ease(1)).toBeCloseTo(1, 5);
});

test("GIVEN control points (0.42, 0, 0.58, 1) WHEN evaluating THEN it produces ease-in-out behavior", () => {
  // GIVEN
  const ease = cubicBezier(0.42, 0, 0.58, 1);

  // THEN — slow at edges, fast in the middle
  expect(ease(0)).toBeCloseTo(0, 5);
  expect(ease(1)).toBeCloseTo(1, 5);
  expect(ease(0.25)).toBeLessThan(0.25);
  expect(ease(0.75)).toBeGreaterThan(0.75);
});

test("GIVEN an input outside [0, 1] WHEN evaluating THEN it clamps to 0 or 1", () => {
  // GIVEN
  const ease = cubicBezier(0.25, 0.1, 0.25, 1);

  // WHEN / THEN
  expect(ease(-0.1)).toBe(0);
  expect(ease(1.5)).toBe(1);
});

test("GIVEN ease-in control points (0.42, 0, 1, 1) WHEN evaluating THEN the curve starts slow", () => {
  // GIVEN
  const easeIn = cubicBezier(0.42, 0, 1, 1);

  // THEN — at x=0.5, y hasn't caught up yet
  expect(easeIn(0.5)).toBeLessThan(0.5);
  expect(easeIn(0.5)).toBeCloseTo(0.315, 1);
  expect(easeIn(1)).toBeCloseTo(1, 5);
});

test("GIVEN ease-out control points (0, 0, 0.58, 1) WHEN evaluating THEN the curve starts fast", () => {
  // GIVEN
  const easeOut = cubicBezier(0, 0, 0.58, 1);

  // THEN — at x=0.5, y is already ahead
  expect(easeOut(0.5)).toBeGreaterThan(0.5);
  expect(easeOut(1)).toBeCloseTo(1, 5);
});

test("GIVEN a cubic bezier sampled at 64 steps WHEN evaluating at midpoint THEN it is within 0.005 of the true value", () => {
  // GIVEN
  const ease = cubicBezier(0.42, 0, 0.58, 1);

  // WHEN / THEN — error should be under 0.005
  expect(Math.abs(ease(0.5) - 0.5)).toBeLessThan(0.005);
});
