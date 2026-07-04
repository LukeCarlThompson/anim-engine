import { describe, it, expect } from "vitest";

import { getTicker } from "../ticker/get-ticker";
import { createLerp } from "./create-lerp";

describe("createLerp", () => {
  it("approaches a static target over time", () => {
    let target = 0;
    const values: number[] = [];
    const lerp = createLerp({
      to: () => target,
      rate: 2,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    target = 100;

    for (let i = 0; i < 120; i++) {
      getTicker().update(16);
    }

    expect(values.length).toBeGreaterThan(10);
    expect(values[values.length - 1]).toBeGreaterThan(95);
    lerp.kill();
  });

  it("chases a moving target", () => {
    let target = 50;
    const values: number[] = [];
    const lerp = createLerp({
      to: () => target,
      rate: 3,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    for (let t = 0; t < 120; t++) {
      if (t === 30) target = 200;
      getTicker().update(16);
    }

    expect(values[values.length - 1]).toBeGreaterThan(100);
    lerp.kill();
  });

  it("rate of 0 does nothing", () => {
    let target = 0;
    const lerp = createLerp({
      to: () => target,
      rate: 0,
      onUpdate: () => {},
    });

    target = 100;
    for (let i = 0; i < 30; i++) getTicker().update(16);

    expect(lerp.currentValue).toBe(0);
    lerp.kill();
  });

  it("default start position is at target", () => {
    const lerp = createLerp({
      to: () => 100,
      rate: 2,
    });

    expect(lerp.currentValue).toBe(100);
    lerp.kill();
  });

  it("setCurrent before first tick sets initial position", () => {
    const lerp = createLerp({
      to: () => 100,
      rate: 2,
    });
    lerp.setCurrent(50);

    expect(lerp.currentValue).toBe(50);
    lerp.kill();
  });

  it("setCurrent teleports the value", () => {
    let target = 0;
    const lerp = createLerp({
      to: () => target,
      rate: 2,
      onUpdate: () => {},
    });

    target = 100;
    getTicker().update(16);
    lerp.setCurrent(500);

    expect(lerp.currentValue).toBe(500);
    lerp.kill();
  });

  it("stop pauses and start resumes", () => {
    let target = 0;
    const lerp = createLerp({
      to: () => target,
      rate: 5,
      onUpdate: () => {},
    });

    target = 100;
    for (let i = 0; i < 10; i++) getTicker().update(16);
    const before = lerp.currentValue;

    lerp.stop();
    for (let i = 0; i < 10; i++) getTicker().update(16);

    expect(lerp.currentValue).toBe(before);

    lerp.start();
    for (let i = 0; i < 10; i++) getTicker().update(16);

    expect(lerp.currentValue).toBeGreaterThan(before);
    lerp.kill();
  });

  it("kill stops the lerp and removes from ticker", () => {
    let target = 0;
    const lerp = createLerp({
      to: () => target,
      rate: 2,
      onUpdate: () => {},
    });

    target = 100;
    getTicker().update(16);
    lerp.kill();

    const killedValue = lerp.currentValue;
    getTicker().update(16);

    expect(lerp.currentValue).toBe(killedValue);
    expect(lerp.status).toBe("inactive");
  });

  it("onUpdate receives velocity that decreases as it approaches target", () => {
    let target = 0;
    const velocities: number[] = [];
    const lerp = createLerp({
      to: () => target,
      rate: 3,
      onUpdate: (_v, vel) => {
        velocities.push(vel);
      },
    });

    target = 100;
    for (let i = 0; i < 30; i++) getTicker().update(16);

    // First velocity should be positive (moving toward target)
    expect(velocities[0]).toBeGreaterThan(0);
    expect(velocities[0]).toBeCloseTo(300, 5);
    // Last velocity should be smaller (slowing down as it approaches)
    expect(velocities[velocities.length - 1]).toBeLessThan(velocities[0]);
    // velocity getter matches last onUpdate value
    expect(lerp.velocity).toBe(velocities[velocities.length - 1]);
    lerp.kill();
  });

  it("rate can be a dynamic accessor function", () => {
    let target = 0;
    let currentRate = 0.5;
    const values: number[] = [];
    const lerp = createLerp({
      to: () => target,
      rate: () => currentRate,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    target = 100;
    for (let i = 0; i < 60; i++) getTicker().update(16);
    const afterSlow = lerp.currentValue;

    currentRate = 10;
    for (let i = 0; i < 30; i++) getTicker().update(16);

    expect(lerp.currentValue).toBeGreaterThan(afterSlow);
    lerp.kill();
  });
});
