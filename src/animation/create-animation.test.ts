import { beforeEach, expect, test } from "vitest";

import { getTicker } from "../ticker/get-ticker";
import { createAnimation } from "./create-animation";

beforeEach(() => {
  getTicker().stop();
});

test("tween from 0 to 100 over 1000ms finishes at 100", async () => {
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 100, durationMs: 1000, ease: "linear" });
  const p = tween.play();
  ticker.update(1000);
  await p;
  expect(tween.currentValue).toBe(100);
  expect(tween.status).toBe("stopped");
});

test("tween resolves to end value with outElastic ease", async () => {
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 200, durationMs: 500, ease: "outElastic" });
  const p = tween.play();
  ticker.update(500);
  await p;
  expect(tween.currentValue).toBe(200);
});

test("pause at 500ms, resume, completes correctly", async () => {
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 100, durationMs: 1000, ease: "linear" });
  const p = tween.play();

  ticker.update(500);
  expect(Math.trunc(tween.currentValue)).toBe(50);

  tween.pause();
  ticker.update(500);
  expect(Math.trunc(tween.currentValue)).toBe(50);

  tween.resume();
  ticker.update(500);
  await p;
  expect(tween.currentValue).toBe(100);
});

test("stop mid-tween resolves promise at current value", async () => {
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 100, durationMs: 1000, ease: "linear" });
  const p = tween.play();
  ticker.update(400);
  tween.stop();
  await p;
  expect(Math.trunc(tween.currentValue)).toBe(40);
});

test("skipToEnd resolves at end value", async () => {
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 100, durationMs: 1000, ease: "linear" });
  const p = tween.play();
  ticker.update(300);
  tween.skipToEnd();
  await p;
  expect(tween.currentValue).toBe(100);
});

test("kill leaves promise unresolved and prevents replay", async () => {
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 100, durationMs: 1000, ease: "linear" });
  tween.play();
  ticker.update(300);
  tween.kill();
  await Promise.resolve();
  expect(tween.status).toBe("dead");
  expect(() => tween.play()).toThrow();
});

test("dynamic from/to functions are evaluated at play time", async () => {
  const ticker = getTicker();
  let from = 20;
  let to = 80;
  const tween = createAnimation({
    from: () => from,
    to: () => to,
    durationMs: 100,
    ease: "linear",
  });
  const p = tween.play();
  ticker.update(100);
  await p;
  expect(tween.currentValue).toBe(80);
});

test("dead status throws on play()", () => {
  const tween = createAnimation({ from: 0, to: 100, durationMs: 100, ease: "linear" });
  tween.kill();
  expect(() => tween.play()).toThrow();
});

test("onStarted fires when playback begins", async () => {
  const ticker = getTicker();
  let started = false;
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 100,
    ease: "linear",
    onStarted: () => {
      started = true;
    },
  });
  const p = tween.play();
  expect(started).toBe(true);
  ticker.update(100);
  await p;
});

test("onEnded fires on completion", async () => {
  const ticker = getTicker();
  let ended = false;
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 100,
    ease: "linear",
    onEnded: () => {
      ended = true;
    },
  });
  const p = tween.play();
  ticker.update(100);
  await p;
  expect(ended).toBe(true);
});

test("onUpdate receives correct intermediate values", async () => {
  const ticker = getTicker();
  const updates: number[] = [];
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
    onUpdate: (v) => {
      updates.push(Math.round(v));
    },
  });
  const p = tween.play();
  ticker.update(250);
  ticker.update(250);
  ticker.update(250);
  ticker.update(250);
  await p;
  expect(updates[0]).toBe(25);
  expect(updates[1]).toBe(50);
  expect(updates[2]).toBe(75);
  expect(updates[3]).toBe(100);
});

test("repeats specified number of times", async () => {
  const ticker = getTicker();
  let count = 0;
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 100,
    ease: "linear",
    repeat: 2,
    onUpdate: () => {
      count++;
    },
  });
  const p = tween.play();
  ticker.update(100);
  ticker.update(100);
  ticker.update(100);
  await p;
  expect(tween.currentValue).toBe(100);
  expect(count).toBeGreaterThanOrEqual(3);
});

test("delayMs delays the start", async () => {
  const ticker = getTicker();
  let started = false;
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 100,
    ease: "linear",
    delayMs: 200,
    onStarted: () => {
      started = true;
    },
  });
  const p = tween.play();

  ticker.update(100);
  expect(started).toBe(false);
  expect(tween.currentValue).toBe(0);

  ticker.update(100);
  expect(started).toBe(true);

  ticker.update(100);
  await p;
  expect(tween.currentValue).toBe(100);
});

// ─── Keyframe mode ───

test("keyframes with 2 points equals single tween", async () => {
  const ticker = getTicker();
  const a = createAnimation({
    keyframes: [
      { at: 0, value: 0 },
      { at: 100, value: 100, ease: "linear" },
    ],
    onUpdate: () => {},
  });
  const p = a.play();
  ticker.update(100);
  await p;
  expect(a.currentValue).toBe(100);
});

test("keyframes with 3 points interpolates correctly", async () => {
  const ticker = getTicker();
  const values: number[] = [];
  const a = createAnimation({
    keyframes: [
      { at: 0, value: 0 },
      { at: 100, value: 100, ease: "linear" },
      { at: 200, value: 50, ease: "linear" },
    ],
    onUpdate: (v) => {
      values.push(Math.round(v));
    },
  });
  const p = a.play();
  ticker.update(100);
  ticker.update(100);
  await p;
  expect(values[values.length - 1]).toBe(50);
});

test("keyframe velocity is non-zero during movement", async () => {
  const ticker = getTicker();
  const velocities: number[] = [];
  const a = createAnimation({
    keyframes: [
      { at: 0, value: 0 },
      { at: 1000, value: 100, ease: "linear" },
    ],
    onUpdate: (_v, vel) => {
      velocities.push(vel);
    },
  });
  const p = a.play();
  // Advance by 2 frames (33ms each) — not enough to complete
  ticker.update(33);
  ticker.update(33);
  // Check we got velocity during movement
  expect(velocities.length).toBeGreaterThan(0);
  // First velocity should be 100 units/s (linear, 100 units over 1000ms)
  expect(velocities[0]).toBeCloseTo(100, 5);
  // Complete the animation to the end
  ticker.update(1000);
  await p;
  // Last velocity should be 0 (at rest)
  expect(velocities[velocities.length - 1]).toBe(0);
  // Velocity getter matches last value
  expect(a.velocity).toBe(velocities[velocities.length - 1]);
});
