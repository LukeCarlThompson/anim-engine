import { beforeEach, expect, test } from "vitest";

import { getTicker } from "../ticker/get-ticker";
import { createTimeline } from "./create-timeline";

beforeEach(() => {
  getTicker().stop();
});

test("GIVEN a timeline with two parallel layers WHEN played to completion THEN both layers finish", async () => {
  // GIVEN
  const ticker = getTicker();
  let x = 0;
  let y = 0;

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 100, gap: 100 }],
        onUpdate: (v) => {
          x = v;
        },
      },
    },
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 200, gap: 100 }],
        onUpdate: (v) => {
          y = v;
        },
      },
    },
  ]);

  // WHEN
  const p = tl.play();
  ticker.update(100);
  await p;

  // THEN
  expect(x).toBe(100);
  expect(y).toBe(200);
});

test("GIVEN consecutive layers with gap:0 WHEN played THEN they play one after another", async () => {
  // GIVEN
  const ticker = getTicker();
  const values: number[] = [];

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 100, gap: 100 }],
        onUpdate: (v) => {
          values.push(v);
        },
      },
    },
    {
      gap: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 200, gap: 100 }],
        onUpdate: (v) => {
          values.push(v);
        },
      },
    },
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

test("GIVEN two parallel layers of different durations WHEN played THEN they run in parallel", async () => {
  // GIVEN
  const ticker = getTicker();
  let step1 = false;
  let step2 = false;

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 50 }],
        onUpdate: (v) => {
          if (v >= 1) step1 = true;
        },
      },
    },
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 100 }],
        onUpdate: (v) => {
          if (v >= 1) step2 = true;
        },
      },
    },
  ]);

  // WHEN
  const p = tl.play();
  ticker.update(100);
  await p;

  // THEN
  expect(step1).toBe(true);
  expect(step2).toBe(true);
});

test("GIVEN a timeline with a gap between layers WHEN played THEN the gap is respected", async () => {
  // GIVEN
  const ticker = getTicker();
  const times: number[] = [];

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 50 }],
        onUpdate: () => {
          times.push(1);
        },
      },
    },
    {
      gap: 100,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 50 }],
        onUpdate: () => {
          times.push(2);
        },
      },
    },
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

test("GIVEN a timeline with gap:100 after a 50ms layer WHEN played THEN the gap is precisely waited", async () => {
  // GIVEN
  const ticker = getTicker();
  let bStartedAt = -1;
  let elapsed = 0;

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 50 }],
      },
    },
    {
      gap: 100,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 50 }],
        onStarted: () => {
          bStartedAt = elapsed;
        },
      },
    },
  ]);

  // WHEN
  const p = tl.play();

  const advance = (dt: number) => {
    elapsed += dt;
    ticker.update(dt);
  };

  // A runs 0–50ms, gap 50–150ms, B runs 150–200ms
  advance(25);
  expect(bStartedAt).toBe(-1);
  advance(25);
  expect(bStartedAt).toBe(-1);

  advance(25);
  expect(bStartedAt).toBe(-1);
  advance(25);
  expect(bStartedAt).toBe(-1);
  advance(25);
  expect(bStartedAt).toBe(-1);

  advance(25);
  expect(bStartedAt).toBe(150);

  advance(50);
  await p;
});

test("GIVEN three layers chained with gaps WHEN played THEN each waits for the previous to finish plus gap", async () => {
  // GIVEN
  const ticker = getTicker();
  const starts: number[] = [];
  let elapsed = 0;

  const tl = createTimeline([
    {
      at: 0,
      animation: { keyframes: [{ value: 0 }, { value: 1, gap: 50 }] },
    },
    {
      gap: 100,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 50 }],
        onStarted: () => starts.push(elapsed),
      },
    },
    {
      gap: 100,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 50 }],
        onStarted: () => starts.push(elapsed),
      },
    },
  ]);

  // Expected: A at 0ms, B at 150ms (50+100), C at 300ms (200+100)

  const p = tl.play();
  const advance = (dt: number) => {
    elapsed += dt;
    ticker.update(dt);
  };

  while (elapsed < 400) advance(25);
  await p;

  expect(starts).toEqual([150, 300]);
});

test("GIVEN a timeline with a dynamic duration in a keyframe WHEN re-played with a different duration THEN the gap adjusts", async () => {
  // GIVEN
  const ticker = getTicker();
  let dur = 100;
  let bStartedAt = -1;
  let elapsed = 0;

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: () => dur }],
      },
    },
    {
      gap: 50,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 50 }],
        onStarted: () => {
          bStartedAt = elapsed;
        },
      },
    },
  ]);

  const advance = (dt: number) => {
    elapsed += dt;
    ticker.update(dt);
  };

  // First play with dur = 100
  let p = tl.play();
  bStartedAt = -1;
  elapsed = 0;
  while (elapsed < 200) advance(25);
  await p;

  expect(bStartedAt).toBe(150);

  // Change dur and re-play
  dur = 50;
  bStartedAt = -1;
  elapsed = 0;
  p = tl.play();
  while (elapsed < 200) advance(25);
  await p;

  expect(bStartedAt).toBe(100);
});

test("GIVEN a timeline with a negative gap WHEN played THEN layers overlap", async () => {
  // GIVEN
  const ticker = getTicker();
  let overlapDetected = false;

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 100, gap: 100 }],
      },
    },
    {
      gap: -50,
      animation: {
        keyframes: [{ value: 0 }, { value: 100, gap: 100 }],
        onUpdate: () => {
          overlapDetected = true;
        },
      },
    },
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

test("GIVEN a timeline with mixed at and gap positions WHEN played THEN layers start at their specified times", async () => {
  // GIVEN
  const ticker = getTicker();
  let started = false;

  const tl = createTimeline([
    {
      at: 0,
      animation: { keyframes: [{ value: 0 }, { value: 1, gap: 50 }] },
    },
    {
      at: 100,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 50 }],
        onUpdate: () => {
          started = true;
        },
      },
    },
  ]);

  // WHEN
  const p = tl.play();
  ticker.update(50);
  ticker.update(30);

  expect(started).toBe(false);

  ticker.update(30);
  ticker.update(30);
  await p;

  expect(started).toBe(true);
});

test("GIVEN a running timeline WHEN paused and later resumed THEN it pauses progress and completes correctly", async () => {
  // GIVEN
  const ticker = getTicker();
  let finalValue = 0;

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 100, gap: 200 }],
        onUpdate: (v) => {
          finalValue = v;
        },
      },
    },
  ]);

  const p = tl.play();

  // Advance to midpoint
  ticker.update(100);

  // Pause
  tl.pause();
  ticker.update(200);
  await Promise.resolve();

  // Frozen at midpoint
  expect(tl.progress).toBeCloseTo(0.5, 1);
  expect(finalValue).toBeCloseTo(50, 0);

  // Resume and complete
  tl.resume();
  ticker.update(100);
  await p;

  expect(finalValue).toBe(100);
});

test("GIVEN a running timeline WHEN skipToEnd is called THEN all layers complete and onEnded fires", async () => {
  // GIVEN
  const ticker = getTicker();
  let ended = false;
  let aValue = 0;
  let bValue = 0;

  const tl = createTimeline(
    [
      {
        at: 0,
        animation: {
          keyframes: [{ value: 0 }, { value: 100, gap: 200 }],
          onUpdate: (v) => {
            aValue = v;
          },
        },
      },
      {
        gap: 0,
        animation: {
          keyframes: [{ value: 0 }, { value: 200, gap: 300 }],
          onUpdate: (v) => {
            bValue = v;
          },
        },
      },
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
  expect(aValue).toBe(100);
  expect(bValue).toBe(200);
  expect(ended).toBe(true);
});

test("GIVEN a timeline that has been killed WHEN play() is called THEN it throws", async () => {
  // GIVEN
  const tl = createTimeline([
    { at: 0, animation: { keyframes: [{ value: 0 }, { value: 100, gap: 100 }] } },
  ]);
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

  const tl = createTimeline(
    [{ at: 0, animation: { keyframes: [{ value: 0 }, { value: 100, gap: 100 }] } }],
    {
      onStarted: () => {
        started = true;
      },
    },
  );

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

  const tl = createTimeline(
    [{ at: 0, animation: { keyframes: [{ value: 0 }, { value: 100, gap: 200 }] } }],
    {
      onProgress: (p) => {
        progressValues.push(Math.round(p * 100));
      },
    },
  );

  // WHEN
  const p = tl.play();
  ticker.update(100);
  ticker.update(100);
  await p;

  // THEN
  expect(progressValues.length).toBeGreaterThanOrEqual(2);
  expect(progressValues[0]).toBeGreaterThanOrEqual(48);
  expect(progressValues[0]).toBeLessThanOrEqual(52);
  expect(progressValues[progressValues.length - 1]).toBeGreaterThanOrEqual(98);
});

test("GIVEN a running timeline WHEN stopped from paused state THEN the stop is handled cleanly", async () => {
  // GIVEN
  const ticker = getTicker();

  const tl = createTimeline([
    { at: 0, animation: { keyframes: [{ value: 0 }, { value: 100, gap: 200 }] } },
  ]);
  tl.play();

  // Advance then pause then stop
  ticker.update(100);
  tl.pause();
  tl.stop();
  await Promise.resolve();

  expect(tl.status).toBe("stopped");
});

test("GIVEN a timeline with two layers WHEN setProgress is called THEN all layers scrub to the correct positions", () => {
  // GIVEN
  let aValue = 0;
  let bValue = 0;

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 100, gap: 200, ease: "linear" }],
        onUpdate: (v) => {
          aValue = v;
        },
      },
    },
    {
      gap: 100,
      animation: {
        keyframes: [{ value: 0 }, { value: 200, gap: 300, ease: "linear" }],
        onUpdate: (v) => {
          bValue = v;
        },
      },
    },
  ]);

  // Timeline: 0-200ms (A), 200-300ms gap, 300-600ms (B). Total: 600ms

  // WHEN — setProgress(0.5) = 300ms. A done, B just starting
  tl.setProgress(0.5);

  expect(tl.progress).toBe(0.5);
  expect(aValue).toBe(100);
  expect(bValue).toBe(0);

  // WHEN — setProgress(0.75) = 450ms. A done, B at 150/300 = progress 0.5
  tl.setProgress(0.75);

  expect(tl.progress).toBe(0.75);
  expect(aValue).toBe(100);
  expect(bValue).toBe(100);

  tl.kill();
});

test("GIVEN a timeline with multiple layers and gaps WHEN queried THEN durationMs returns the total timeline length", () => {
  // GIVEN / WHEN
  const tl = createTimeline([
    {
      at: 0,
      animation: { keyframes: [{ value: 0 }, { value: 100, gap: 200 }] },
    },
    {
      gap: 100,
      animation: { keyframes: [{ value: 0 }, { value: 100, gap: 300 }] },
    },
  ]);

  // THEN
  expect(tl.durationMs).toBe(200 + 100 + 300);
});

// ─── Regression: backward scrubbing determinism ───

test("GIVEN staggered layers WHEN setProgress goes forward then back to 0 THEN all layers return to initial value", () => {
  // Regression: runner.reset() was used for layers before current scrub
  // position, but reset() doesn't fire onUpdate — DOM stayed at stale value.
  // Fix: use evaluate(0) instead to fire onUpdate with the initial value.

  // GIVEN
  const values: Record<string, number> = { a: -1, b: -1, c: -1, d: -1 };

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 800, ease: "outQuart" }],
        onUpdate: (v) => {
          values.a = v;
        },
      },
    },
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 700, ease: "outBounce" }],
        onUpdate: (v) => {
          values.b = v;
        },
      },
    },
    {
      gap: 200,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 1000, ease: "outElastic" }],
        onUpdate: (v) => {
          values.c = v;
        },
      },
    },
    {
      gap: 200,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 600, ease: "inOutBack" }],
        onUpdate: (v) => {
          values.d = v;
        },
      },
    },
  ]);

  // WHEN — scrub forward through various positions
  tl.setProgress(0.25);
  tl.setProgress(0.5);
  tl.setProgress(0.75);
  tl.setProgress(1.0);

  // THEN scrub back to 0
  tl.setProgress(0);

  expect(values.a).toBe(0);
  expect(values.b).toBe(0);
  expect(values.c).toBe(0);
  expect(values.d).toBe(0);

  tl.kill();
});

test("GIVEN staggered layers WHEN setProgress goes back and forth multiple times THEN values at each position are deterministic", () => {
  // GIVEN
  const values: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
  const snapshots: Array<Record<string, number>> = [];

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 800, ease: "outQuart" }],
        onUpdate: (v) => {
          values.a = v;
        },
      },
    },
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 700, ease: "outBounce" }],
        onUpdate: (v) => {
          values.b = v;
        },
      },
    },
    {
      gap: 200,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 1000, ease: "outElastic" }],
        onUpdate: (v) => {
          values.c = v;
        },
      },
    },
    {
      gap: 200,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 600, ease: "inOutBack" }],
        onUpdate: (v) => {
          values.d = v;
        },
      },
    },
  ]);

  // First pass: record values at each position
  for (const p of [0.25, 0.5, 0.75, 1.0, 0.75, 0.5, 0.25, 0]) {
    tl.setProgress(p);
    snapshots.push({ ...values });
  }

  // Second pass: verify same positions produce same values
  const positions = [0.25, 0.5, 0.75, 1.0, 0.75, 0.5, 0.25, 0];
  positions.forEach((p, i) => {
    tl.setProgress(p);
    expect(values.a).toBe(snapshots[i].a);
    expect(values.b).toBe(snapshots[i].b);
    expect(values.c).toBe(snapshots[i].c);
    expect(values.d).toBe(snapshots[i].d);
  });

  // Verify back at 0 after the cycle
  expect(values.a).toBe(0);
  expect(values.b).toBe(0);
  expect(values.c).toBe(0);
  expect(values.d).toBe(0);

  tl.kill();
});

test("GIVEN staggered layers WHEN played partway THEN scrubbing back to 0 sets onUpdate correctly", async () => {
  // Regression: stepping forward via update(), then scrubbing back past
  // a layer's startAt must fire onUpdate with the initial value.

  // GIVEN
  const ticker = getTicker();
  const values: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 800, ease: "outQuart" }],
        onUpdate: (v) => {
          values.a = v;
        },
      },
    },
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 700, ease: "outBounce" }],
        onUpdate: (v) => {
          values.b = v;
        },
      },
    },
    {
      gap: 200,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 1000, ease: "outElastic" }],
        onUpdate: (v) => {
          values.c = v;
        },
      },
    },
    {
      gap: 200,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 600, ease: "inOutBack" }],
        onUpdate: (v) => {
          values.d = v;
        },
      },
    },
  ]);

  // WHEN — play partway into the timeline
  tl.play();
  ticker.update(500);
  await Promise.resolve();
  tl.pause();

  // THEN scrub back to 0
  tl.setProgress(0);

  expect(values.a).toBe(0);
  expect(values.b).toBe(0);
  expect(values.c).toBe(0);
  expect(values.d).toBe(0);

  tl.kill();
});

test("GIVEN staggered layers WHEN played to completion THEN scrubbing back to 0 returns all layers to initial value", async () => {
  // GIVEN
  const ticker = getTicker();
  const values: Record<string, number> = { a: -1, b: -1, c: -1, d: -1 };

  const tl = createTimeline([
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 800, ease: "outQuart" }],
        onUpdate: (v) => {
          values.a = v;
        },
      },
    },
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 700, ease: "outBounce" }],
        onUpdate: (v) => {
          values.b = v;
        },
      },
    },
    {
      gap: 200,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 1000, ease: "outElastic" }],
        onUpdate: (v) => {
          values.c = v;
        },
      },
    },
    {
      gap: 200,
      animation: {
        keyframes: [{ value: 0 }, { value: 640, gap: 600, ease: "inOutBack" }],
        onUpdate: (v) => {
          values.d = v;
        },
      },
    },
  ]);

  // WHEN — play to completion
  const p = tl.play();
  ticker.update(3000);
  await p;

  // THEN scrub back to 0
  tl.setProgress(0);

  expect(values.a).toBe(0);
  expect(values.b).toBe(0);
  expect(values.c).toBe(0);
  expect(values.d).toBe(0);

  tl.kill();
});
