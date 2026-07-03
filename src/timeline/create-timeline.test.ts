import { beforeEach, expect, test } from "vitest";
import { animate } from "../tween/create-tween";
import { createTimeline } from "./create-timeline";
import { getTicker } from "../ticker/get-ticker";

beforeEach(() => {
  getTicker().stop();
});

test("single keyframe at 0 plays all animations", async () => {
  const ticker = getTicker();
  let x = 0;
  let y = 0;

  const a = animate({
    from: 0,
    to: 100,
    durationMs: 100,
    ease: "linear",
    onUpdate: (v) => {
      x = v;
    },
  });
  const b = animate({
    from: 0,
    to: 200,
    durationMs: 100,
    ease: "linear",
    onUpdate: (v) => {
      y = v;
    },
  });

  const tl = createTimeline({ keyframes: [{ at: 0, animations: [a, b] }] });
  const p = tl.play();

  ticker.update(100);
  await p;

  expect(x).toBe(100);
  expect(y).toBe(200);
});

test("consecutive keyframes with gap:0 play one after another", async () => {
  const ticker = getTicker();
  const values: number[] = [];

  const a = animate({
    from: 0,
    to: 100,
    durationMs: 100,
    ease: "linear",
    onUpdate: (v) => {
      values.push(v);
    },
  });
  const b = animate({
    from: 0,
    to: 200,
    durationMs: 100,
    ease: "linear",
    onUpdate: (v) => {
      values.push(v);
    },
  });

  const tl = createTimeline({
    keyframes: [
      { at: 0, animations: [a] },
      { gap: 0, animations: [b] },
    ],
  });
  const p = tl.play();

  ticker.update(100);
  ticker.update(100);
  await p;

  expect(values).toContain(100);
  expect(values).toContain(200);
});

test("parallel animations in one keyframe", async () => {
  const ticker = getTicker();
  let step1 = false;
  let step2 = false;

  const a = animate({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onUpdate: (v) => {
      if (v >= 1) step1 = true;
    },
  });
  const b = animate({
    from: 0,
    to: 1,
    durationMs: 100,
    ease: "linear",
    onUpdate: (v) => {
      if (v >= 1) step2 = true;
    },
  });

  const tl = createTimeline({ keyframes: [{ at: 0, animations: [a, b] }] });
  const p = tl.play();

  ticker.update(100);
  await p;

  expect(step1).toBe(true);
  expect(step2).toBe(true);
});

test("gap between keyframes", async () => {
  const ticker = getTicker();
  const times: number[] = [];

  const a = animate({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onUpdate: () => {
      times.push(1);
    },
  });
  const b = animate({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onUpdate: () => {
      times.push(2);
    },
  });

  const tl = createTimeline({
    keyframes: [
      { at: 0, animations: [a] },
      { gap: 100, animations: [b] },
    ],
  });
  const p = tl.play();

  ticker.update(50);
  await Promise.resolve();
  ticker.update(60);
  await Promise.resolve();
  ticker.update(50);
  await p;

  expect(times.filter((t) => t === 1).length).toBeGreaterThanOrEqual(1);
  expect(times.filter((t) => t === 2).length).toBeGreaterThanOrEqual(1);
});

test("negative gap for overlap", async () => {
  const ticker = getTicker();
  let overlapDetected = false;

  const a = animate({ from: 0, to: 100, durationMs: 100, ease: "linear" });
  const b = animate({
    from: 0,
    to: 100,
    durationMs: 100,
    ease: "linear",
    onUpdate: () => {
      overlapDetected = true;
    },
  });

  const tl = createTimeline({
    keyframes: [
      { at: 0, animations: [a] },
      { gap: -50, animations: [b] },
    ],
  });
  const p = tl.play();

  ticker.update(80);
  await Promise.resolve();
  ticker.update(70);
  await p;

  expect(overlapDetected).toBe(true);
});

test("mixed at and gap keyframes", async () => {
  const ticker = getTicker();
  let started = false;

  const a = animate({ from: 0, to: 1, durationMs: 50, ease: "linear" });
  const b = animate({
    from: 0,
    to: 1,
    durationMs: 50,
    ease: "linear",
    onUpdate: () => {
      started = true;
    },
  });

  const tl = createTimeline({
    keyframes: [
      { at: 0, animations: [a] },
      { at: 100, animations: [b] },
    ],
  });
  const p = tl.play();

  ticker.update(50);
  ticker.update(30);
  expect(started).toBe(false);
  ticker.update(30);
  ticker.update(30);
  await p;

  expect(started).toBe(true);
});

test("pause and resume", async () => {
  const ticker = getTicker();

  const a = animate({ from: 0, to: 100, durationMs: 200, ease: "linear" });
  const tl = createTimeline({ keyframes: [{ at: 0, animations: [a] }] });
  const p = tl.play();

  ticker.update(100);
  tl.pause();
  ticker.update(200);
  await Promise.resolve();

  expect(tl.progress).toBeCloseTo(0.5, 1);
  expect(a.currentValue).toBeCloseTo(50, 0);

  tl.resume();
  ticker.update(100);
  await p;

  expect(a.currentValue).toBe(100);
});

test("skipToEnd completes all", async () => {
  const ticker = getTicker();
  let ended = false;

  const a = animate({ from: 0, to: 100, durationMs: 200, ease: "linear" });
  const b = animate({ from: 0, to: 200, durationMs: 300, ease: "linear" });
  const tl = createTimeline({
    keyframes: [
      { at: 0, animations: [a] },
      { gap: 0, animations: [b] },
    ],
    onEnded: () => {
      ended = true;
    },
  });
  const p = tl.play();

  ticker.update(50);
  tl.skipToEnd();
  await p;

  expect(a.currentValue).toBe(100);
  expect(b.currentValue).toBe(200);
  expect(ended).toBe(true);
});

test("kill prevents replay", async () => {
  const a = animate({ from: 0, to: 100, durationMs: 100, ease: "linear" });
  const tl = createTimeline({ keyframes: [{ at: 0, animations: [a] }] });
  void tl.play();

  tl.kill();
  await Promise.resolve();

  expect(tl.status).toBe("dead");
  expect(() => tl.play()).toThrow();
});

test("getDurationMs returns total timeline length", () => {
  const a = animate({ from: 0, to: 100, durationMs: 200, ease: "linear" });
  const b = animate({ from: 0, to: 100, durationMs: 300, ease: "linear" });

  const tl = createTimeline({
    keyframes: [
      { at: 0, animations: [a] },
      { gap: 100, animations: [b] },
    ],
  });

  expect(tl.getDurationMs()).toBe(200 + 100 + 300);
});
