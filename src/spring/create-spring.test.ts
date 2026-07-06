import { beforeEach, expect, test } from "vitest";

import { getTicker } from "../domain";
import { createSpring } from "./create-spring";

beforeEach(() => {
  getTicker().stop();
});

test("GIVEN a spring with onEnded callback WHEN it settles at the target THEN onEnded fires and status stays active", () => {
  // GIVEN
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

  // WHEN
  target = 100;
  for (let i = 0; i < 200; i++) {
    ticker.update(16);
  }

  // THEN
  expect(spring.currentValue).toBeCloseTo(100, 0);
  expect(ended).toBe(true);
  expect(spring.status).toBe("active");
});

test("GIVEN a spring with high stiffness WHEN updated over time THEN it settles faster", () => {
  // GIVEN
  const ticker = getTicker();
  let target = 0;

  const spring = createSpring({
    to: () => target,
    stiffness: 400,
    damping: 20,
    mass: 1,
    precision: 0.01,
  });

  // WHEN
  target = 100;
  for (let i = 0; i < 100; i++) {
    ticker.update(16);
  }

  // THEN
  expect(spring.currentValue).toBeCloseTo(100, 0);
});

test("GIVEN a running spring WHEN setCurrentValue is called THEN it teleports and resets velocity", () => {
  // GIVEN
  const ticker = getTicker();
  let target = 0;

  const spring = createSpring({
    to: () => target,
    stiffness: 100,
    damping: 10,
  });

  // WHEN
  target = 100;
  ticker.update(16);
  spring.setCurrentValue(50);

  // THEN
  expect(spring.currentValue).toBe(50);
  expect(spring.velocity).toBe(0);
});

test("GIVEN a spring created without explicit starting value WHEN created THEN currentValue defaults to the target", () => {
  // GIVEN / WHEN
  const spring = createSpring({ to: () => 100, stiffness: 200, damping: 15 });

  // THEN
  expect(spring.currentValue).toBe(100);
  spring.kill();
});

test("GIVEN a spring WHEN setCurrentValue is called before the first tick THEN it sets the initial position", () => {
  // GIVEN / WHEN
  const spring = createSpring({ to: () => 100, stiffness: 200, damping: 15 });
  spring.setCurrentValue(50);

  // THEN
  expect(spring.currentValue).toBe(50);
  spring.kill();
});

test("GIVEN a spring with onUpdate velocity callback WHEN it starts moving THEN velocity is reported correctly", () => {
  // GIVEN
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

  // WHEN
  target = 100;
  ticker.update(16);

  // THEN
  expect(velocities.length).toBeGreaterThan(0);
  expect(velocities[0]).toBeCloseTo(320, 5);
  expect(spring.velocity).toBe(velocities[velocities.length - 1]);
  spring.kill();
});

test("GIVEN a running spring WHEN killed THEN it becomes inactive", () => {
  // GIVEN
  const ticker = getTicker();
  let target = 0;

  const spring = createSpring({
    to: () => target,
    stiffness: 100,
    damping: 10,
  });

  // WHEN
  target = 100;
  ticker.update(16);
  spring.kill();

  // THEN
  expect(spring.status).toBe("inactive");
});

test("GIVEN a running spring WHEN stopped THEN it pauses and WHEN started THEN it resumes", () => {
  // GIVEN
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

  // WHEN — stop
  spring.stop();
  const stoppedAt = values[values.length - 1];
  ticker.update(200);

  // THEN — paused
  expect(Math.round(spring.currentValue)).toBe(stoppedAt);

  // WHEN — resume
  spring.start();
  for (let i = 0; i < 200; i++) ticker.update(16);

  // THEN — reaches target
  expect(spring.currentValue).toBeCloseTo(100, 0);
});

test("GIVEN a spring chasing a dynamic target WHEN the target changes THEN it chases the new value", () => {
  // GIVEN
  const ticker = getTicker();
  let target = 50;

  const spring = createSpring({ to: () => target, stiffness: 200, damping: 15 });

  // WHEN
  for (let i = 0; i < 50; i++) ticker.update(16);
  target = 120;
  for (let i = 0; i < 200; i++) ticker.update(16);

  // THEN
  expect(spring.currentValue).toBeCloseTo(120, 0);
  spring.kill();
});
