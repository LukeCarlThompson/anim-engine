import { beforeEach, expect, test } from "vitest";

import { getTicker } from "../ticker/get-ticker";
import { createAnimation } from "./create-animation";

beforeEach(() => {
  getTicker().stop();
});

test("GIVEN a linear tween from 0 to 100 over 1000ms WHEN updated by 1000ms THEN it finishes at 100", async () => {
  // GIVEN
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 100, durationMs: 1000, ease: "linear" });

  // WHEN
  const p = tween.play();
  ticker.update(1000);
  await p;

  // THEN
  expect(tween.currentValue).toBe(100);
  expect(tween.status).toBe("stopped");
});

test("GIVEN a tween WHEN played to completion and played again THEN it animates again", async () => {
  // GIVEN
  const ticker = getTicker();
  let value = 0;
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 50,
    ease: "linear",
    onUpdate: (v) => {
      value = v;
    },
  });

  // WHEN — play once to completion
  const p1 = tween.play();
  ticker.update(50);
  await p1;

  // THEN — first play completes
  expect(value).toBe(100);

  // WHEN — reset and play again
  value = 0;
  tween.setProgress(0);
  const p2 = tween.play();
  ticker.update(25);

  // THEN — animating again from 0 toward 100
  expect(value).toBe(50);

  ticker.update(25);
  await p2;
  expect(value).toBe(100);
});

test("GIVEN an outElastic tween from 0 to 200 over 500ms WHEN it completes THEN it resolves to the end value", async () => {
  // GIVEN
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 200, durationMs: 500, ease: "outElastic" });

  // WHEN
  const p = tween.play();
  ticker.update(500);
  await p;

  // THEN
  expect(tween.currentValue).toBe(200);
});

test("GIVEN a running linear tween WHEN paused at midpoint and later resumed THEN it completes correctly", async () => {
  // GIVEN
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 100, durationMs: 1000, ease: "linear" });
  const p = tween.play();

  // WHEN — advance to 500ms
  ticker.update(500);

  // THEN — midway
  expect(Math.trunc(tween.currentValue)).toBe(50);

  // WHEN — pause
  tween.pause();
  ticker.update(500);

  // THEN — frozen at 50
  expect(Math.trunc(tween.currentValue)).toBe(50);

  // WHEN — resume and complete
  tween.resume();
  ticker.update(500);
  await p;

  // THEN — reaches end
  expect(tween.currentValue).toBe(100);
});

test("GIVEN a running linear tween WHEN stopped mid-way THEN the promise resolves at the current value", async () => {
  // GIVEN
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 100, durationMs: 1000, ease: "linear" });
  const p = tween.play();

  // WHEN
  ticker.update(400);
  tween.stop();
  await p;

  // THEN
  expect(Math.trunc(tween.currentValue)).toBe(40);
});

test("GIVEN a running linear tween WHEN skipToEnd is called THEN the promise resolves at the end value", async () => {
  // GIVEN
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 100, durationMs: 1000, ease: "linear" });
  const p = tween.play();

  // WHEN
  ticker.update(300);
  tween.skipToEnd();
  await p;

  // THEN
  expect(tween.currentValue).toBe(100);
});

test("GIVEN a running tween WHEN killed THEN the promise stays unresolved and replay throws", async () => {
  // GIVEN
  const ticker = getTicker();
  const tween = createAnimation({ from: 0, to: 100, durationMs: 1000, ease: "linear" });
  tween.play();

  // WHEN
  ticker.update(300);
  tween.kill();
  await Promise.resolve();

  // THEN
  expect(tween.status).toBe("dead");
  expect(() => tween.play()).toThrow();
});

test("GIVEN a tween with dynamic from/to functions WHEN played THEN the values are evaluated at play time", async () => {
  // GIVEN
  const ticker = getTicker();
  let from = 20;
  let to = 80;
  const tween = createAnimation({
    from: () => from,
    to: () => to,
    durationMs: 100,
    ease: "linear",
  });

  // WHEN
  const p = tween.play();
  ticker.update(100);
  await p;

  // THEN
  expect(tween.currentValue).toBe(80);
});

test("GIVEN a tween that has been killed WHEN play() is called THEN it throws", () => {
  // GIVEN
  const tween = createAnimation({ from: 0, to: 100, durationMs: 100, ease: "linear" });
  tween.kill();

  // WHEN / THEN
  expect(() => tween.play()).toThrow();
});

test("GIVEN a tween with onStarted callback WHEN playback begins THEN the callback fires", async () => {
  // GIVEN
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

  // WHEN
  const p = tween.play();

  // THEN
  expect(started).toBe(true);
  ticker.update(100);
  await p;
});

test("GIVEN a tween with onEnded callback WHEN it completes THEN the callback fires", async () => {
  // GIVEN
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

  // WHEN
  const p = tween.play();
  ticker.update(100);
  await p;

  // THEN
  expect(ended).toBe(true);
});

test("GIVEN a linear tween with onUpdate callback WHEN it progresses through frames THEN it receives the correct intermediate values", async () => {
  // GIVEN
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

  // WHEN
  const p = tween.play();
  ticker.update(250);
  ticker.update(250);
  ticker.update(250);
  ticker.update(250);
  await p;

  // THEN
  expect(updates[0]).toBe(25);
  expect(updates[1]).toBe(50);
  expect(updates[2]).toBe(75);
  expect(updates[3]).toBe(100);
});

test("GIVEN an outCubic tween WHEN setProgress(0.5) is called THEN currentValue is computed immediately", () => {
  // GIVEN
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "outCubic",
  });

  // WHEN
  tween.setProgress(0.5);

  // THEN
  expect(tween.progress).toBe(0.5);
  expect(tween.currentValue).toBeGreaterThan(80);
  expect(tween.currentValue).toBeLessThan(90);
});

test("GIVEN a tween with delayMs: 200 WHEN played THEN onStarted is delayed and playback starts after the delay", async () => {
  // GIVEN
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

  // WHEN — advance 100ms (before delay ends)
  ticker.update(100);

  // THEN — not yet started
  expect(started).toBe(false);
  expect(tween.currentValue).toBe(0);

  // WHEN — advance another 100ms (delay expires)
  ticker.update(100);

  // THEN — started
  expect(started).toBe(true);

  // WHEN — complete
  ticker.update(100);
  await p;

  // THEN — reaches end value
  expect(tween.currentValue).toBe(100);
});

// ─── setCurrentValue ───

test("GIVEN a running linear tween WHEN setCurrentValue is called THEN it teleports the value and resets velocity", async () => {
  // GIVEN
  const ticker = getTicker();
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
  });
  const p = tween.play();

  // WHEN
  ticker.update(300);
  tween.setCurrentValue(500);

  // THEN
  expect(tween.currentValue).toBe(500);
  expect(tween.velocity).toBe(0);

  tween.stop();
  await p;
});

test("GIVEN a running tween WHEN setCurrentValue is called mid-way THEN it teleports and subsequent updates animate from the new position", async () => {
  // GIVEN
  const ticker = getTicker();
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
  });
  const p = tween.play();

  // WHEN — advance 300ms (at 30), then teleport to 500
  ticker.update(300);
  tween.setCurrentValue(500);

  // THEN — immediate teleport
  expect(tween.currentValue).toBe(500);
  expect(tween.velocity).toBe(0);

  // WHEN — advance another 700ms (the remaining progress from the original duration perspective)
  ticker.update(700);
  await p;

  // THEN — completes at the to value
  expect(tween.currentValue).toBe(100);
});

// ─── Very short durationMs edge case ───

test("GIVEN a tween with a very short durationMs of 1 WHEN played with a large delta THEN it snaps to the end value", async () => {
  // GIVEN
  const ticker = getTicker();
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 1,
    ease: "linear",
  });

  // WHEN
  const p = tween.play();
  ticker.update(16);
  await p;

  // THEN
  expect(tween.currentValue).toBe(100);
  expect(tween.status).toBe("stopped");
});

// ─── Keyframe mode ───

test("GIVEN keyframes with 2 points WHEN played THEN it behaves the same as a single tween", async () => {
  // GIVEN
  const ticker = getTicker();
  const a = createAnimation({
    keyframes: [
      { at: 0, value: 0 },
      { at: 100, value: 100, ease: "linear" },
    ],
    onUpdate: () => {},
  });

  // WHEN
  const p = a.play();
  ticker.update(100);
  await p;

  // THEN
  expect(a.currentValue).toBe(100);
});

test("GIVEN keyframes with 3 points WHEN played through THEN it interpolates between them correctly", async () => {
  // GIVEN
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

  // WHEN
  const p = a.play();
  ticker.update(100);
  ticker.update(100);
  await p;

  // THEN
  expect(values[values.length - 1]).toBe(50);
});

test("GIVEN a keyframe animation with velocity tracking WHEN it moves THEN velocity is non-zero and returns to zero at rest", async () => {
  // GIVEN
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

  // WHEN — advance by 2 frames (66ms total)
  const p = a.play();
  ticker.update(33);
  ticker.update(33);

  // THEN — velocity is non-zero during movement
  expect(velocities.length).toBeGreaterThan(0);
  expect(velocities[0]).toBeCloseTo(100, 5);

  // WHEN — complete the animation
  ticker.update(1000);
  await p;

  // THEN — velocity returns to zero at rest
  expect(velocities[velocities.length - 1]).toBe(0);
  expect(a.velocity).toBe(velocities[velocities.length - 1]);
});
