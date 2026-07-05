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

test("GIVEN a timeline with gap:100 after a 50ms animation WHEN played THEN the gap is precisely waited", async () => {
  // GIVEN
  const ticker = getTicker();
  let bStartedAt = -1;
  let elapsed = 0;

  const a = createAnimation({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
  });
  const b = createAnimation({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onStarted: () => {
      bStartedAt = elapsed;
    },
  });

  const tl = createTimeline([
    { at: 0, animation: [a] },
    { gap: 100, animation: [b] },
  ]);

  // WHEN — advance frame by frame through the gap
  const p = tl.play();

  // Helper: update elapsed first so onStarted picks up the right time
  const advance = (dt: number) => {
    elapsed += dt;
    ticker.update(dt);
  };

  // Timeline: A runs 0–50ms, gap 50–150ms, B runs 150–200ms
  // Advance through A's duration
  advance(25);
  expect(bStartedAt).toBe(-1);

  advance(25);
  expect(bStartedAt).toBe(-1);

  // Advance through gap (50–150ms)
  advance(25);
  expect(bStartedAt).toBe(-1);

  advance(25);
  expect(bStartedAt).toBe(-1);

  advance(25);
  expect(bStartedAt).toBe(-1);

  // Advance to where gap ends (150ms)
  advance(25);

  // THEN — B should start exactly at 150ms
  expect(bStartedAt).toBe(150);

  // Complete
  advance(50);
  await p;
});

test("GIVEN three animations chained with gaps WHEN played THEN each waits for the previous to finish plus gap", async () => {
  // GIVEN
  const ticker = getTicker();
  const starts: number[] = [];
  let elapsed = 0;

  const a = createAnimation({ from: 0, to: 1, durationMs: 50, ease: "linear" });
  const b = createAnimation({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onStarted: () => starts.push(elapsed),
  });
  const c = createAnimation({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onStarted: () => starts.push(elapsed),
  });

  const tl = createTimeline([
    { at: 0, animation: [a] },
    { gap: 100, animation: [b] },
    { gap: 100, animation: [c] },
  ]);

  // Expected: A at 0ms, B at 150ms (50+100), C at 300ms (200+100)

  // WHEN — advance through the whole sequence
  const p = tl.play();
  const advance = (dt: number) => {
    elapsed += dt;
    ticker.update(dt);
  };

  // Run to completion in 25ms steps
  while (elapsed < 400) advance(25);
  await p;

  // THEN — B and C each respect their gap relative to the previous animation's end
  // B: 50 + 100 = 150ms. C: 200 + 100 = 300ms.
  expect(starts).toEqual([150, 300]);
});

test("GIVEN a timeline with an animation using dynamic durationMs WHEN re-played with a different duration THEN the gap adjusts to the new duration", async () => {
  // GIVEN
  const ticker = getTicker();
  let dur = 100;
  let bStartedAt = -1;
  let elapsed = 0;

  const a = createAnimation({
    from: 0,
    to: 1,
    durationMs: () => dur,
    ease: "linear",
  });
  const b = createAnimation({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onStarted: () => {
      bStartedAt = elapsed;
    },
  });

  const tl = createTimeline([
    { at: 0, animation: [a] },
    { gap: 50, animation: [b] },
  ]);

  const advance = (dt: number) => {
    elapsed += dt;
    ticker.update(dt);
  };

  // WHEN — first play with dur = 100
  let p = tl.play();
  bStartedAt = -1;
  elapsed = 0;
  while (elapsed < 200) advance(25);
  await p;

  // THEN — B triggered at creation-time endAt (100) + gap (50) = 150
  expect(bStartedAt).toBe(150);

  // WHEN — change dur and re-play
  dur = 50;

  bStartedAt = -1;
  elapsed = 0;
  p = tl.play();
  while (elapsed < 200) advance(25);
  await p;

  // THEN — B should trigger at new endAt (50) + gap (50) = 100
  // But currently it still uses the stale creation-time batch position (150)
  expect(bStartedAt).toBe(100);
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

test("GIVEN a timeline with onStarted callback WHEN played THEN the callback fires", async () => {
  // GIVEN
  const ticker = getTicker();
  let started = false;

  const a = createAnimation({ from: 0, to: 100, durationMs: 100, ease: "linear" });
  const tl = createTimeline([{ at: 0, animation: [a] }], {
    onStarted: () => {
      started = true;
    },
  });

  // WHEN
  const p = tl.play();

  // THEN
  expect(started).toBe(true);
  ticker.update(100);
  await p;
});

test("GIVEN a timeline with onProgress callback WHEN it advances through frames THEN the callback receives progress values", async () => {
  // GIVEN
  const ticker = getTicker();
  const progressValues: number[] = [];

  const a = createAnimation({ from: 0, to: 100, durationMs: 200, ease: "linear" });
  const tl = createTimeline([{ at: 0, animation: [a] }], {
    onProgress: (p) => {
      progressValues.push(Math.round(p * 100));
    },
  });

  // WHEN
  const p = tl.play();
  ticker.update(100);
  ticker.update(100);
  await p;

  // THEN — progress should go from ~0.5 to ~1.0
  expect(progressValues.length).toBeGreaterThanOrEqual(2);
  expect(progressValues[0]).toBeGreaterThanOrEqual(48);
  expect(progressValues[0]).toBeLessThanOrEqual(52);
  expect(progressValues[progressValues.length - 1]).toBeGreaterThanOrEqual(98);
});

test("GIVEN a running timeline WHEN stopped from paused state THEN the stop is handled cleanly", async () => {
  // GIVEN
  const ticker = getTicker();

  const a = createAnimation({
    from: 0,
    to: 100,
    durationMs: 200,
    ease: "linear",
  });
  const tl = createTimeline([{ at: 0, animation: [a] }]);
  tl.play();

  // WHEN — advance then pause then stop
  ticker.update(100);
  tl.pause();
  tl.stop();
  await Promise.resolve();

  // THEN — status is stopped
  expect(tl.status).toBe("stopped");
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
