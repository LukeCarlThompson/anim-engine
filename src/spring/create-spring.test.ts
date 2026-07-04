import { beforeEach, expect, test } from "vitest";

import { getTicker } from "../ticker/get-ticker";
import { createSpring } from "./create-spring";

beforeEach(() => {
  getTicker().stop();
});

test("spring settles at target and fires onEnded", () => {
  const ticker = getTicker();
  let target = 0;
  let ended = false;

  const spring = createSpring({
    to: () => target,
    stiffness: 100,
    damping: 10,
    mass: 1,
    precision: 0.01,
    onEnded: () => {
      ended = true;
    },
  });

  target = 100;

  for (let i = 0; i < 200; i++) {
    ticker.update(16);
  }

  expect(spring.currentValue).toBeCloseTo(100, 0);
  expect(ended).toBe(true);
  // Stays active — target function may return a new value
  expect(spring.status).toBe("active");
});

test("spring with high stiffness settles faster", () => {
  const ticker = getTicker();
  let target = 0;

  const spring = createSpring({
    to: () => target,
    stiffness: 400,
    damping: 20,
    mass: 1,
    precision: 0.01,
  });

  target = 100;

  for (let i = 0; i < 100; i++) {
    ticker.update(16);
  }

  expect(spring.currentValue).toBeCloseTo(100, 0);
});

test("setCurrentValue teleports mid-animation", () => {
  const ticker = getTicker();
  let target = 0;

  const spring = createSpring({
    to: () => target,
    stiffness: 100,
    damping: 10,
  });

  target = 100;
  ticker.update(16);
  spring.setCurrentValue(50);
  expect(spring.currentValue).toBe(50);
  expect(spring.velocity).toBe(0);
});

test("default start position is at target", () => {
  const spring = createSpring({ to: () => 100, stiffness: 200, damping: 15 });

  expect(spring.currentValue).toBe(100);
  spring.kill();
});

test("setCurrentValue before first tick sets initial position", () => {
  const spring = createSpring({ to: () => 100, stiffness: 200, damping: 15 });
  spring.setCurrentValue(50);

  expect(spring.currentValue).toBe(50);
  spring.kill();
});

test("onUpdate receives velocity", () => {
  const ticker = getTicker();
  const velocities: number[] = [];
  let target = 0;

  const spring = createSpring({
    to: () => target,
    stiffness: 200,
    damping: 15,
    mass: 1,
    onUpdate: (_v, vel) => {
      velocities.push(vel);
    },
  });

  target = 100;
  ticker.update(16);

  expect(velocities.length).toBeGreaterThan(0);
  expect(velocities[0]).toBeCloseTo(320, 5);
  expect(spring.velocity).toBe(velocities[velocities.length - 1]);
  spring.kill();
});

test("kill removes from ticker", () => {
  const ticker = getTicker();
  let target = 0;

  const spring = createSpring({
    to: () => target,
    stiffness: 100,
    damping: 10,
  });

  target = 100;
  ticker.update(16);
  spring.kill();

  expect(spring.status).toBe("inactive");
});

test("start and stop control the spring", () => {
  const ticker = getTicker();
  const values: number[] = [];
  let target = 0;

  const spring = createSpring({
    to: () => target,
    stiffness: 200,
    damping: 15,
    onUpdate: (v) => {
      values.push(Math.round(v));
    },
  });

  target = 100;
  ticker.update(16);
  ticker.update(16);

  spring.stop();
  const stoppedAt = values[values.length - 1];

  ticker.update(200);
  // Should not have changed after stop
  expect(Math.round(spring.currentValue)).toBe(stoppedAt);

  spring.start();
  for (let i = 0; i < 200; i++) ticker.update(16);

  expect(spring.currentValue).toBeCloseTo(100, 0);
});

test("chases dynamic target function", () => {
  const ticker = getTicker();
  let target = 50;

  const spring = createSpring({ to: () => target, stiffness: 200, damping: 15 });

  for (let i = 0; i < 50; i++) ticker.update(16);

  target = 120;
  for (let i = 0; i < 200; i++) ticker.update(16);

  expect(spring.currentValue).toBeCloseTo(120, 0);

  spring.kill();
});
