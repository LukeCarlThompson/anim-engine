import { expect, test } from "vitest";

import { createSmoothClamp } from "./create-smooth-clamp";

test("GIVEN a smooth clamp with threshold 100 WHEN given small inputs THEN the output is nearly linear", () => {
  // GIVEN
  const clamp = createSmoothClamp(100);

  // WHEN / THEN
  expect(clamp(0)).toBeCloseTo(0, 5);
  expect(clamp(1)).toBeCloseTo(0.9901, 3);
  expect(clamp(10)).toBeCloseTo(9.0909, 3);
});

test("GIVEN a smooth clamp with threshold 100 WHEN given inputs exceeding the threshold THEN the output never exceeds the threshold", () => {
  // GIVEN
  const clamp = createSmoothClamp(100);

  // WHEN / THEN
  expect(clamp(200)).toBeLessThan(100);
  expect(clamp(1000)).toBeLessThan(100);
  expect(clamp(100000)).toBeLessThanOrEqual(100);
  expect(clamp(Infinity)).toBeCloseTo(100, 5);
  expect(clamp(-Infinity)).toBeCloseTo(-100, 5);
});

test("GIVEN a smooth clamp with threshold 100 WHEN given large inputs THEN the output approaches the threshold asymptotically", () => {
  // GIVEN
  const clamp = createSmoothClamp(100);

  // WHEN / THEN
  expect(clamp(500)).toBeCloseTo(83.33, 1);
  expect(clamp(1000)).toBeCloseTo(90.91, 1);
});

test("GIVEN a smooth clamp with threshold 100 WHEN given negative inputs THEN the output is symmetric with positive inputs", () => {
  // GIVEN
  const clamp = createSmoothClamp(100);

  // WHEN / THEN
  expect(clamp(-1)).toBeCloseTo(-0.9901, 3);
  expect(clamp(-100)).toBeCloseTo(-50, 1);
  expect(clamp(-50)).toBeCloseTo(-clamp(50), 4);
});
