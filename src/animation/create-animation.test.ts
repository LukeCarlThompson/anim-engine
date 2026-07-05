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

test("GIVEN a single tween with onUpdate callback WHEN it progresses through every tick THEN it is called on each frame with the correct value and velocity", async () => {
  // GIVEN
  const ticker = getTicker();
  const updates: Array<{ value: number; velocity: number }> = [];
  const tween = createAnimation({
    from: 0,
    to: 100,
    durationMs: 200,
    ease: "linear",
    onUpdate: (v, vel) => {
      updates.push({ value: Math.round(v), velocity: vel });
    },
  });

  // WHEN — advance in 50ms steps (4 frames)
  const p = tween.play();
  ticker.update(50);
  ticker.update(50);
  ticker.update(50);
  ticker.update(50);
  await p;

  // THEN — onUpdate fired on every frame, with correct values
  expect(updates.length).toBe(4);
  expect(updates[0].value).toBe(25);
  expect(updates[1].value).toBe(50);
  expect(updates[2].value).toBe(75);
  expect(updates[3].value).toBe(100);

  // AND velocity is non-zero during motion and zero at end
  expect(updates[0].velocity).toBeGreaterThan(0);
  expect(updates[1].velocity).toBeGreaterThan(0);
  expect(updates[2].velocity).toBeGreaterThan(0);
  expect(updates[3].velocity).toBe(0);
});

test("GIVEN a tween with three keyframes onUpdate callback WHEN it plays through all segments THEN it receives the correct interpolated values", async () => {
  // GIVEN — 0→100 over 100ms, then 100→50 over 100ms
  const ticker = getTicker();
  const updates: Array<{ value: number; velocity: number }> = [];
  const a = createAnimation({
    keyframes: [
      { value: 0 },
      { value: 100, gap: 100, ease: "linear" },
      { value: 50, gap: 100, ease: "linear" },
    ],
    onUpdate: (v, vel) => {
      updates.push({ value: Math.round(v), velocity: vel });
    },
  });

  // WHEN — advance in 50ms steps (segment 1: 0→50→100, segment 2: 100→75→50)
  const p = a.play();
  ticker.update(50);   // first segment, 50%
  ticker.update(50);   // first segment, 100% / start of second
  ticker.update(50);   // second segment, 50%
  ticker.update(50);   // second segment, 100%
  await p;

  // THEN
  expect(updates.length).toBe(4);
  expect(updates[0].value).toBe(50);   // 50% through 0→100
  expect(updates[1].value).toBe(100);  // 100% through 0→100
  expect(updates[2].value).toBe(75);   // 50% through 100→50
  expect(updates[3].value).toBe(50);   // 100% through 100→50

  // AND velocity positive during climb, zero at keyframe boundary, negative during descent, zero at end
  expect(updates[0].velocity).toBeGreaterThan(0);
  expect(updates[1].velocity).toBe(0);          // end of first segment
  expect(updates[2].velocity).toBeLessThan(0);
  expect(updates[3].velocity).toBe(0);
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

test("GIVEN a keyframe with a hold at the start WHEN played THEN it behaves like a delayed tween", async () => {
  // GIVEN — hold at 0 for 200ms, then animate to 100 over 100ms
  const ticker = getTicker();
  const tween = createAnimation({
    keyframes: [
      { value: 0 },
      { value: 0, gap: 200, ease: "linear" },
      { value: 100, gap: 100, ease: "linear" },
    ],
  });
  const p = tween.play();

  // WHEN — advance 100ms (during hold)
  ticker.update(100);

  // THEN — still at start
  expect(tween.currentValue).toBe(0);

  // WHEN — advance to hold boundary (200ms)
  ticker.update(100);

  // WHEN — one more tick into the animation segment
  ticker.update(20);

  // THEN — should now be mid-animation (20ms into the 0→100 segment)
  expect(tween.currentValue).toBeGreaterThan(0);

  // WHEN — complete
  ticker.update(80);
  await p;

  // THEN — reaches end value
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
    keyframes: [{ value: 0 }, { value: 100, gap: 100, ease: "linear" }],
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
      { value: 0 },
      { value: 100, gap: 100, ease: "linear" },
      { value: 50, gap: 100, ease: "linear" },
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
    keyframes: [{ value: 0 }, { value: 100, gap: 1000, ease: "linear" }],
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
