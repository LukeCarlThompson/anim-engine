import { beforeEach, expect, test } from "vitest";

import { createAnimation } from "../animation/create-animation";
import { getTicker } from "../ticker/get-ticker";
import { createTimeline } from "./create-timeline";

beforeEach(() => {
  getTicker().stop();
});

test("GIVEN a timeline with a single keyframe at 0 containing two animations WHEN played to completion THEN both animations finish", async () => {
  // GIVEN
  const ticker = getTicker();
  let x = 0;
  let y = 0;

  const a = createAnimation({
    from: 0,
    to: 100,
    durationMs: 100,
    ease: "linear",
    onUpdate: (v) => {
      x = v;
    },
  });
  const b = createAnimation({
    from: 0,
    to: 200,
    durationMs: 100,
    ease: "linear",
    onUpdate: (v) => {
      y = v;
    },
  });

  const tl = createTimeline([{ at: 0, animation: [a, b] }]);

  // WHEN
  const p = tl.play();
  ticker.update(100);
  await p;

  // THEN
  expect(x).toBe(100);
  expect(y).toBe(200);
});

test("GIVEN consecutive keyframes with gap:0 WHEN played THEN they play one after another", async () => {
  // GIVEN
  const ticker = getTicker();
  const values: number[] = [];

  const a = createAnimation({
    from: 0,
    to: 100,
    durationMs: 100,
    ease: "linear",
    onUpdate: (v) => {
      values.push(v);
    },
  });
  const b = createAnimation({
    from: 0,
    to: 200,
    durationMs: 100,
    ease: "linear",
    onUpdate: (v) => {
      values.push(v);
    },
  });

  const tl = createTimeline([
    { at: 0, animation: [a] },
    { gap: 0, animation: [b] },
  ]);

  // WHEN
  const p = tl.play();
  ticker.update(100);
  ticker.update(100);
  await p;

  // THEN
  expect(values).toContain(100);
  expect(values).toContain(200);
});

test("GIVEN a single keyframe with multiple animations of different durations WHEN played THEN they run in parallel", async () => {
  // GIVEN
  const ticker = getTicker();
  let step1 = false;
  let step2 = false;

  const a = createAnimation({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onUpdate: (v) => {
      if (v >= 1) step1 = true;
    },
  });
  const b = createAnimation({
    from: 0,
    to: 1,
    durationMs: 100,
    ease: "linear",
    onUpdate: (v) => {
      if (v >= 1) step2 = true;
    },
  });

  const tl = createTimeline([{ at: 0, animation: [a, b] }]);

  // WHEN
  const p = tl.play();
  ticker.update(100);
  await p;

  // THEN
  expect(step1).toBe(true);
  expect(step2).toBe(true);
});

test("GIVEN a timeline with a gap between keyframes WHEN played THEN the gap is respected between animations", async () => {
  // GIVEN
  const ticker = getTicker();
  const times: number[] = [];

  const a = createAnimation({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onUpdate: () => {
      times.push(1);
    },
  });
  const b = createAnimation({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onUpdate: () => {
      times.push(2);
    },
  });

  const tl = createTimeline([
    { at: 0, animation: [a] },
    { gap: 100, animation: [b] },
  ]);

  // WHEN
  const p = tl.play();
  ticker.update(50);
  await Promise.resolve();
  ticker.update(60);
  await Promise.resolve();
  ticker.update(50);
  await p;

  // THEN
  expect(times.filter((t) => t === 1).length).toBeGreaterThanOrEqual(1);
  expect(times.filter((t) => t === 2).length).toBeGreaterThanOrEqual(1);
});

test("GIVEN a timeline with a negative gap WHEN played THEN animations overlap", async () => {
  // GIVEN
  const ticker = getTicker();
  let overlapDetected = false;

  const a = createAnimation({ from: 0, to: 100, durationMs: 100, ease: "linear" });
  const b = createAnimation({
    from: 0,
    to: 100,
    durationMs: 100,
    ease: "linear",
    onUpdate: () => {
      overlapDetected = true;
    },
  });

  const tl = createTimeline([
    { at: 0, animation: [a] },
    { gap: -50, animation: [b] },
  ]);

  // WHEN
  const p = tl.play();
  ticker.update(80);
  await Promise.resolve();
  ticker.update(70);
  await p;

  // THEN
  expect(overlapDetected).toBe(true);
});

test("GIVEN a timeline with mixed at and gap positions WHEN played THEN keyframes start at their specified times", async () => {
  // GIVEN
  const ticker = getTicker();
  let started = false;

  const a = createAnimation({ from: 0, to: 1, durationMs: 50, ease: "linear" });
  const b = createAnimation({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onUpdate: () => {
      started = true;
    },
  });

  const tl = createTimeline([
    { at: 0, animation: [a] },
    { at: 100, animation: [b] },
  ]);

  // WHEN
  const p = tl.play();
  ticker.update(50);
  ticker.update(30);

  // THEN — not yet started
  expect(started).toBe(false);

  // WHEN — advance past the 100ms mark
  ticker.update(30);
  ticker.update(30);
  await p;

  // THEN — second animation started
  expect(started).toBe(true);
});

test("GIVEN a running timeline WHEN paused and later resumed THEN it pauses progress and completes correctly", async () => {
  // GIVEN
  const ticker = getTicker();

  const a = createAnimation({ from: 0, to: 100, durationMs: 200, ease: "linear" });
  const tl = createTimeline([{ at: 0, animation: [a] }]);
  const p = tl.play();

  // WHEN — advance to midpoint
  ticker.update(100);

  // WHEN — pause
  tl.pause();
  ticker.update(200);
  await Promise.resolve();

  // THEN — frozen at midpoint
  expect(tl.progress).toBeCloseTo(0.5, 1);
  expect(a.currentValue).toBeCloseTo(50, 0);

  // WHEN — resume and complete
  tl.resume();
  ticker.update(100);
  await p;

  // THEN — reaches end
  expect(a.currentValue).toBe(100);
});

test("GIVEN a running timeline WHEN skipToEnd is called THEN all animations complete and onEnded fires", async () => {
  // GIVEN
  const ticker = getTicker();
  let ended = false;

  const a = createAnimation({ from: 0, to: 100, durationMs: 200, ease: "linear" });
  const b = createAnimation({ from: 0, to: 200, durationMs: 300, ease: "linear" });
  const tl = createTimeline(
    [
      { at: 0, animation: [a] },
      { gap: 0, animation: [b] },
    ],
    {
      onEnded: () => {
        ended = true;
      },
    },
  );

  // WHEN
  const p = tl.play();
  ticker.update(50);
  tl.skipToEnd();
  await p;

  // THEN
  expect(a.currentValue).toBe(100);
  expect(b.currentValue).toBe(200);
  expect(ended).toBe(true);
});

test("GIVEN a timeline that has been killed WHEN play() is called THEN it throws", async () => {
  // GIVEN
  const a = createAnimation({ from: 0, to: 100, durationMs: 100, ease: "linear" });
  const tl = createTimeline([{ at: 0, animation: [a] }]);
  void tl.play();

  // WHEN
  tl.kill();
  await Promise.resolve();

  // THEN
  expect(tl.status).toBe("dead");
  expect(() => tl.play()).toThrow();
});

test("GIVEN a timeline with two keyframes WHEN setProgress is called THEN all animations scrub to the correct positions", () => {
  // GIVEN
  let aValue = 0;
  let bValue = 0;

  const a = createAnimation({
    from: 0,
    to: 100,
    durationMs: 200,
    ease: "linear",
    onUpdate: (v) => {
      aValue = v;
    },
  });
  const b = createAnimation({
    from: 0,
    to: 200,
    durationMs: 300,
    ease: "linear",
    onUpdate: (v) => {
      bValue = v;
    },
  });

  const tl = createTimeline([
    { at: 0, animation: [a] },
    { gap: 100, animation: [b] },
  ]);

  // Timeline: 0-200ms (A), 200-300ms gap, 300-600ms (B). Total: 600ms

  // WHEN — setProgress(0.5) = 300ms. A done, B just starting
  tl.setProgress(0.5);

  // THEN
  expect(tl.progress).toBe(0.5);
  expect(aValue).toBe(100);
  expect(bValue).toBe(0);

  // WHEN — setProgress(0.75) = 450ms. A done, B at 150/300 = progress 0.5
  tl.setProgress(0.75);

  // THEN
  expect(tl.progress).toBe(0.75);
  expect(aValue).toBe(100);
  expect(bValue).toBe(100);

  tl.kill();
});

test("GIVEN a timeline with multiple keyframes and gaps WHEN queried THEN durationMs returns the total timeline length", () => {
  // GIVEN / WHEN
  const a = createAnimation({ from: 0, to: 100, durationMs: 200, ease: "linear" });
  const b = createAnimation({ from: 0, to: 100, durationMs: 300, ease: "linear" });

  const tl = createTimeline([
    { at: 0, animation: [a] },
    { gap: 100, animation: [b] },
  ]);

  // THEN
  expect(tl.durationMs).toBe(200 + 100 + 300);
});
