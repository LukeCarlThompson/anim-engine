import { beforeEach, expect, test } from "vitest";
import { createSpring } from "./create-spring";
import { getTicker } from "../ticker/get-ticker";

beforeEach(() => {
  getTicker().stop();
});

test("spring settles at target", async () => {
  const ticker = getTicker();
  const spring = createSpring({
    from: 0,
    to: 100,
    stiffness: 100,
    damping: 10,
    mass: 1,
    precision: 0.01,
  });

  for (let i = 0; i < 200; i++) {
    ticker.update(16);
  }

  expect(spring.currentValue).toBeCloseTo(100, 0);
  expect(spring.status).toBe("inactive");
});

test("spring with high stiffness settles faster", async () => {
  const ticker = getTicker();
  const spring = createSpring({
    from: 0,
    to: 100,
    stiffness: 400,
    damping: 20,
    mass: 1,
    precision: 0.01,
  });

  for (let i = 0; i < 100; i++) {
    ticker.update(16);
  }

  expect(spring.currentValue).toBeCloseTo(100, 0);
});

test("setCurrent teleports mid-animation", async () => {
  const ticker = getTicker();
  const spring = createSpring({ from: 0, to: 100, stiffness: 100, damping: 10 });

  ticker.update(16);
  spring.setCurrent(50);
  expect(spring.currentValue).toBe(50);
  expect(spring.velocity).toBe(0);
});

test("kill removes from ticker", async () => {
  const ticker = getTicker();
  const spring = createSpring({ from: 0, to: 100, stiffness: 100, damping: 10 });

  ticker.update(16);
  spring.kill();

  expect(spring.status).toBe("inactive");
});

test("start and stop control the spring", async () => {
  const ticker = getTicker();
  const values: number[] = [];
  const spring = createSpring({
    from: 0,
    to: 100,
    stiffness: 200,
    damping: 15,
    onUpdate: (v) => {
      values.push(Math.round(v));
    },
  });

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

test("chases dynamic target function", async () => {
  const ticker = getTicker();
  let target = 50;

  const spring = createSpring({ from: 0, to: () => target, stiffness: 200, damping: 15 });

  for (let i = 0; i < 50; i++) ticker.update(16);

  target = 120;
  for (let i = 0; i < 200; i++) ticker.update(16);

  expect(spring.currentValue).toBeCloseTo(120, 0);

  spring.kill();
});
