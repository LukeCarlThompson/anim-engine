import { describe, it, expect } from "vitest";

import { getTicker } from "../ticker/get-ticker";
import { createSmoothDamp } from "./create-smooth-damp";

describe("createSmoothDamp", () => {
  it("approaches a static target over time", () => {
    let target = 0;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTime: 0.3,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    target = 100;

    for (let i = 0; i < 120; i++) {
      getTicker().update(16);
    }

    expect(values.length).toBeGreaterThan(10);
    expect(values[values.length - 1]).toBeGreaterThan(97);
    sd.kill();
  });

  it("chases a moving target", () => {
    let target = 100;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTime: 0.5,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    for (let t = 0; t < 120; t++) {
      if (t === 30) target = 200;
      getTicker().update(16);
    }

    expect(values[values.length - 1]).toBeGreaterThan(150);
    sd.kill();
  });

  it("default start position is at target", () => {
    const sd = createSmoothDamp({
      to: () => 100,
      smoothTime: 0.3,
    });

    expect(sd.currentValue).toBe(100);
    sd.kill();
  });

  it("setCurrentValue before first tick sets initial position", () => {
    const sd = createSmoothDamp({
      to: () => 100,
      smoothTime: 0.3,
    });
    sd.setCurrentValue(50);

    expect(sd.currentValue).toBe(50);
    sd.kill();
  });

  it("setCurrentValue teleports the value", () => {
    let target = 0;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTime: 1,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    target = 100;
    getTicker().update(16);
    sd.setCurrentValue(500);

    expect(sd.currentValue).toBe(500);
    sd.kill();
  });

  it("stop pauses progress and start resumes it", () => {
    let target = 0;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTime: 0.2,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    target = 100;
    for (let i = 0; i < 10; i++) getTicker().update(16);
    const before = sd.currentValue;

    sd.stop();
    for (let i = 0; i < 10; i++) getTicker().update(16);

    expect(sd.currentValue).toBe(before);

    sd.start();
    for (let i = 0; i < 10; i++) getTicker().update(16);

    expect(sd.currentValue).toBeGreaterThan(before);
    sd.kill();
  });

  it("kill stops the damp and removes from ticker", () => {
    let target = 0;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTime: 0.3,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    target = 100;
    getTicker().update(16);
    sd.kill();

    const killedValue = sd.currentValue;
    getTicker().update(16);

    expect(sd.currentValue).toBe(killedValue);
    expect(sd.status).toBe("inactive");
  });

  it("onUpdate receives velocity", () => {
    let target = 0;
    const velocities: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTime: 0.3,
      onUpdate: (_v, vel) => {
        velocities.push(vel);
      },
    });

    target = 100;
    getTicker().update(16);

    expect(velocities.length).toBeGreaterThan(0);
    expect(velocities[0]).toBeCloseTo(63.93, 1);
    expect(sd.velocity).toBe(velocities[velocities.length - 1]);
    sd.kill();
  });

  it("uses maxSpeed to cap velocity", () => {
    let target = 0;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTime: 0.1,
      maxSpeed: 10,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    target = 1000;
    // Single large frame
    getTicker().update(16);

    // Should have moved at most maxSpeed * deltaTime ~ 10 * 0.016 = 0.16
    expect(sd.currentValue).toBeLessThan(1);
    sd.kill();
  });
});
