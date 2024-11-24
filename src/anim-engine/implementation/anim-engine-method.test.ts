import { beforeAll, beforeEach, expect, test } from "vitest";

import type { Ticker } from "./ticker";
import { createAnimEngine } from "../create-anim-engine";
import { getTicker } from "../get-ticker";

/**
 * Tests on the runtime methods of the AnimEngine class.
 */

beforeAll(() => {
  const ticker = getTicker();
  ticker.autoStart = false;
});

beforeEach(() => {
  const ticker = getTicker() as Ticker;
  ticker.reset();
});

test(`GIVEN a tween from 0 to 100 over 1000ms
      WHEN the ticker is run for over 1000ms
      THEN the current value should be 100`, async () => {
  const ticker = getTicker();
  let time = 0;

  const animEngine = createAnimEngine({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
  });

  const playPromise = animEngine.play();

  for (let i = 0; time <= 1000; i++) {
    time += 10;
    ticker.update(time);
  }

  await playPromise;

  expect(animEngine.currentValue).toEqual(100);
});

test(`GIVEN a tween from 0 to 100 over 1000ms
      WHEN stop is called after 500ms
      THEN the play promise should resolve`, async () => {
  const ticker = getTicker();
  let time = 0;

  const animEngine = createAnimEngine({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
  });

  const playPromise = animEngine.play();

  let didResolve = false;
  void playPromise.then(() => {
    didResolve = true;
  });

  for (let i = 0; time <= 500; i++) {
    time += 10;
    ticker.update(time);
  }

  animEngine.stop();

  await playPromise;

  expect(didResolve).toBe(true);
});

test(`GIVEN a tween from 0 to 100 over 1000ms
      WHEN it is paused after 500ms and then resumed after 1000ms
      THEN the play promise should not resolve when paused and should resolve when the animation ends`, async () => {
  const ticker = getTicker();
  let time = 0;

  const animEngine = createAnimEngine({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
  });

  const playPromise = animEngine.play();

  let didResolve = false;

  void playPromise.then(() => {
    didResolve = true;
  });

  for (let i = 0; time <= 500; i++) {
    ticker.update(time);
    time += 10;
  }

  animEngine.pause();

  for (let i = 0; time <= 1000; i++) {
    time += 10;
    ticker.update(time);
  }

  await Promise.resolve();

  expect(didResolve).toBe(false);

  animEngine.resume();

  for (let i = 0; time <= 1500; i++) {
    time += 10;
    ticker.update(time);
  }

  await playPromise;

  expect(didResolve).toBe(true);
});

test(`GIVEN a tween from 0 to 100 over 1000ms
      WHEN it is stopped after 500ms
      THEN the play promise should resolve and the current value should be 50`, async () => {
  const ticker = getTicker();
  let time = 0;

  const animEngine = createAnimEngine({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
  });

  const playPromise = animEngine.play();

  let didResolve = false;

  void playPromise.then(() => {
    didResolve = true;
  });

  for (let i = 0; time <= 500; i++) {
    ticker.update(time);
    time += 10;
  }

  animEngine.stop();

  await playPromise;

  expect(didResolve).toBe(true);
  expect(Math.trunc(animEngine.currentValue)).toBe(50);
});

test(`GIVEN a tween from 0 to 100 over 1000ms
      WHEN it is skipped to end after 500ms
      THEN the play promise should resolve and the current value should be 100`, async () => {
  const ticker = getTicker();
  let time = 0;

  const animEngine = createAnimEngine({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
  });

  const playPromise = animEngine.play();

  let didResolve = false;

  void playPromise.then(() => {
    didResolve = true;
  });

  for (let i = 0; time <= 500; i++) {
    ticker.update(time);
    time += 10;
  }

  animEngine.skipToEnd();

  await playPromise;

  expect(didResolve).toBe(true);
  expect(Math.trunc(animEngine.currentValue)).toBe(100);
});

test(`GIVEN a tween from 0 to 100 over 1000ms
      WHEN it is killed after 500ms
      THEN the play promise should not resolve and playing it again should throw an error`, async () => {
  const ticker = getTicker();
  let time = 0;

  const animEngine = createAnimEngine({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
  });

  const playPromise = animEngine.play();

  let didResolve = false;

  void playPromise.then(() => {
    didResolve = true;
  });

  for (let i = 0; time <= 500; i++) {
    ticker.update(time);
    time += 10;
  }

  animEngine.kill();

  for (let i = 0; time <= 2000; i++) {
    ticker.update(time);
    time += 10;
  }

  await Promise.resolve();

  expect(didResolve).toBe(false);
  expect(() => animEngine.play()).toThrowError();
});
