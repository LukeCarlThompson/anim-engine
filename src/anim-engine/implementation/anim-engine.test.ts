import { expect, test } from "vitest";

import { createAnimEngine } from "../create-anim-engine";
import { getTicker } from "../get-ticker";

test(`GIVEN a basic tween
  WHEN tweening from 0 to 100 over 1000 ms
  THEN after 1000 ms the current value should be 100`, async () => {
  const ticker = getTicker();
  ticker.autoStart = false;

  const animEngine = createAnimEngine({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
  });

  const playPromise = animEngine.play();

  let time = 0;
  for (let i = 0; i < 101; i++) {
    time += 10;
    ticker.update(time);
  }

  await playPromise;

  expect(animEngine.currentValue).toEqual(100);
});

test(`GIVEN a basic tween
  WHEN tweening from 0 to 100 over 1000 ms
  THEN after 500 ms stop is called then play promise should resolve`, async () => {
  const ticker = getTicker();
  ticker.autoStart = false;

  const animEngine = createAnimEngine({
    from: 0,
    to: 100,
    durationMs: 1000,
    ease: "linear",
  });

  const playPromise = animEngine.play();

  let time = 0;
  for (let i = 0; i < 50; i++) {
    time += 10;
    ticker.update(time);
  }

  animEngine.stop();

  let didResolve = false;

  await playPromise.then(() => {
    didResolve = true;
  });

  expect(didResolve).toBe(true);
});
