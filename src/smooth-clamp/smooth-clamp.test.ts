import { expect, test } from "vitest";

import { createSmoothClamp } from "./smooth-clamp";

test("returns near-linear output for small inputs", () => {
  const clamp = createSmoothClamp(100);

  expect(clamp(0)).toBeCloseTo(0, 5);
  expect(clamp(1)).toBeCloseTo(0.9901, 3);
  expect(clamp(10)).toBeCloseTo(9.0909, 3);
});

test("never exceeds threshold", () => {
  const clamp = createSmoothClamp(100);

  expect(clamp(200)).toBeLessThan(100);
  expect(clamp(1000)).toBeLessThan(100);
  // Very large inputs approach but never exceed threshold
  expect(clamp(100000)).toBeLessThanOrEqual(100);
  expect(clamp(Infinity)).toBeCloseTo(100, 5);
  expect(clamp(-Infinity)).toBeCloseTo(-100, 5);
});

test("approaches threshold asymptotically", () => {
  const clamp = createSmoothClamp(100);

  expect(clamp(500)).toBeCloseTo(83.33, 1);
  expect(clamp(1000)).toBeCloseTo(90.91, 1);
});

test("handles negative inputs symmetrically", () => {
  const clamp = createSmoothClamp(100);

  expect(clamp(-1)).toBeCloseTo(-0.9901, 3);
  expect(clamp(-100)).toBeCloseTo(-50, 1);
  // Symmetry
  expect(clamp(-50)).toBeCloseTo(-clamp(50), 4);
});
