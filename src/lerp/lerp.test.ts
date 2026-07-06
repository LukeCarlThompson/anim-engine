import { describe, it, expect } from "vitest";

import { getTicker } from "../domain";
import { createLerp } from "./create-lerp";

describe("createLerp", () => {
  it("GIVEN a lerp with a static target WHEN updated over time THEN it approaches the target value", () => {
    // GIVEN
    let target = 0;
    const values: number[] = [];
    const lerp = createLerp({
      to: () => target,
      smoothTimeMs: 300,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // WHEN
    target = 100;
    for (let i = 0; i < 60; i++) {
      getTicker().update(16);
    }

    // THEN
    expect(values.length).toBeGreaterThan(10);
    expect(values[values.length - 1]).toBeGreaterThan(95);
    lerp.kill();
  });

  it("GIVEN a lerp chasing a dynamic target WHEN the target changes mid-way THEN it follows the new target", () => {
    // GIVEN
    let target = 50;
    const values: number[] = [];
    const lerp = createLerp({
      to: () => target,
      smoothTimeMs: 200,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // WHEN
    for (let t = 0; t < 120; t++) {
      if (t === 30) target = 200;
      getTicker().update(16);
    }

    // THEN
    expect(values[values.length - 1]).toBeGreaterThan(100);
    lerp.kill();
  });

  it("GIVEN a lerp with a very large smoothTimeMs WHEN updated only a few times THEN it barely moves", () => {
    // GIVEN
    let target = 0;
    const lerp = createLerp({
      to: () => target,
      smoothTimeMs: 100000,
      onUpdate: () => {},
    });

    // WHEN
    target = 100;
    for (let i = 0; i < 10; i++) getTicker().update(16);

    // THEN
    expect(lerp.currentValue).toBeLessThan(1);
    lerp.kill();
  });

  it("GIVEN a lerp without an explicit starting value WHEN created THEN currentValue defaults to the target", () => {
    // GIVEN / WHEN
    const lerp = createLerp({
      to: () => 100,
      smoothTimeMs: 200,
    });

    // THEN
    expect(lerp.currentValue).toBe(100);
    lerp.kill();
  });

  it("GIVEN a lerp WHEN setCurrentValue is called before the first tick THEN it sets the initial position", () => {
    // GIVEN / WHEN
    const lerp = createLerp({
      to: () => 100,
      smoothTimeMs: 200,
    });
    lerp.setCurrentValue(50);

    // THEN
    expect(lerp.currentValue).toBe(50);
    lerp.kill();
  });

  it("GIVEN a running lerp WHEN setCurrentValue is called THEN it teleports the value instantly", () => {
    // GIVEN
    let target = 0;
    const lerp = createLerp({
      to: () => target,
      smoothTimeMs: 200,
      onUpdate: () => {},
    });

    // WHEN
    target = 100;
    getTicker().update(16);
    lerp.setCurrentValue(500);

    // THEN
    expect(lerp.currentValue).toBe(500);
    lerp.kill();
  });

  it("GIVEN a running lerp WHEN stopped THEN it pauses progress and WHEN started THEN it resumes", () => {
    // GIVEN
    let target = 0;
    const lerp = createLerp({
      to: () => target,
      smoothTimeMs: 200,
      onUpdate: () => {},
    });

    target = 100;
    for (let i = 0; i < 10; i++) getTicker().update(16);
    const before = lerp.currentValue;

    // WHEN — stop
    lerp.stop();
    for (let i = 0; i < 10; i++) getTicker().update(16);

    // THEN — paused
    expect(lerp.currentValue).toBe(before);

    // WHEN — resume
    lerp.start();
    for (let i = 0; i < 10; i++) getTicker().update(16);

    // THEN — progressing again
    expect(lerp.currentValue).toBeGreaterThan(before);
    lerp.kill();
  });

  it("GIVEN a running lerp WHEN killed THEN it stops updating and becomes inactive", () => {
    // GIVEN
    let target = 0;
    const lerp = createLerp({
      to: () => target,
      smoothTimeMs: 200,
      onUpdate: () => {},
    });

    target = 100;
    getTicker().update(16);

    // WHEN
    lerp.kill();
    const killedValue = lerp.currentValue;
    getTicker().update(16);

    // THEN
    expect(lerp.currentValue).toBe(killedValue);
    expect(lerp.status).toBe("inactive");
  });

  it("GIVEN a lerp with an onUpdate velocity callback WHEN approaching the target THEN velocity decreases over time", () => {
    // GIVEN
    let target = 0;
    const velocities: number[] = [];
    const lerp = createLerp({
      to: () => target,
      smoothTimeMs: 500,
      onUpdate: (_v, vel) => {
        velocities.push(vel);
      },
    });

    // WHEN
    target = 100;
    for (let i = 0; i < 30; i++) getTicker().update(16);

    // THEN
    expect(velocities[0]).toBeGreaterThan(0);
    expect(velocities[0]).toBeCloseTo(600, 5);
    expect(velocities[velocities.length - 1]).toBeLessThan(velocities[0]);
    expect(lerp.velocity).toBe(velocities[velocities.length - 1]);
    lerp.kill();
  });

  it("GIVEN a lerp with onEnded callback WHEN it settles on the target THEN onEnded fires", () => {
    // GIVEN
    let target = 0;
    let ended = false;
    const lerp = createLerp({
      to: () => target,
      smoothTimeMs: 300,
      precision: 0.01,
      onEnded: () => {
        ended = true;
      },
    });

    // WHEN
    target = 100;
    for (let i = 0; i < 120; i++) {
      getTicker().update(16);
    }

    // THEN
    expect(ended).toBe(true);
    expect(lerp.currentValue).toBeCloseTo(100, 0);
    lerp.kill();
  });

  it("GIVEN a lerp with a dynamic smoothTimeMs function WHEN smoothTimeMs changes mid-animation THEN the speed adjusts", () => {
    // GIVEN
    let target = 0;
    let currentSmoothTimeMs = 1000;
    const values: number[] = [];
    const lerp = createLerp({
      to: () => target,
      smoothTimeMs: () => currentSmoothTimeMs,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // WHEN — start with slow smoothTime
    target = 100;
    for (let i = 0; i < 60; i++) getTicker().update(16);
    const afterSlow = lerp.currentValue;

    // WHEN — reduce smoothTime (speed up)
    currentSmoothTimeMs = 100;
    for (let i = 0; i < 30; i++) getTicker().update(16);

    // THEN — value progresses faster
    expect(lerp.currentValue).toBeGreaterThan(afterSlow);
    lerp.kill();
  });
});
