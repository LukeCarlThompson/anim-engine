import { describe, it, expect } from "vitest";
import { createSmoothDamp } from "./create-smooth-damp";
import { getTicker } from "../ticker/get-ticker";

describe("createSmoothDamp", () => {
  it("approaches a static target over time", () => {
    const values: number[] = [];
    const sd = createSmoothDamp({
      from: () => 0,
      to: () => 100,
      smoothTime: 0.3,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // Simulate frames
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
      from: () => 0,
      to: () => target,
      smoothTime: 0.5,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // Simulate frames with target moving
    for (let t = 0; t < 120; t++) {
      if (t === 30) target = 200;
      getTicker().update(16);
    }

    // Should have moved past initial target and be approaching new target
    expect(values[values.length - 1]).toBeGreaterThan(150);
    sd.kill();
  });

  it("setCurrent teleports the value", () => {
    const values: number[] = [];
    const sd = createSmoothDamp({
      from: () => 0,
      to: () => 100,
      smoothTime: 1,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    getTicker().update(16);
    sd.setCurrent(500);

    // Check immediately after setCurrent, before next tick
    expect(sd.currentValue).toBe(500);
    sd.kill();
  });

  it("stop pauses progress and start resumes it", () => {
    const values: number[] = [];
    const sd = createSmoothDamp({
      from: () => 0,
      to: () => 100,
      smoothTime: 0.2,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // Let it move for 10 frames
    for (let i = 0; i < 10; i++) getTicker().update(16);
    const before = sd.currentValue;

    sd.stop();
    for (let i = 0; i < 10; i++) getTicker().update(16);

    // Should be frozen
    expect(sd.currentValue).toBe(before);

    sd.start();
    for (let i = 0; i < 10; i++) getTicker().update(16);

    // Should resume moving
    expect(sd.currentValue).toBeGreaterThan(before);
    sd.kill();
  });

  it("kill stops the damp and removes from ticker", () => {
    const values: number[] = [];
    const sd = createSmoothDamp({
      from: () => 0,
      to: () => 100,
      smoothTime: 0.3,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    getTicker().update(16);
    sd.kill();

    const killedValue = sd.currentValue;
    getTicker().update(16); // This should do nothing

    expect(sd.currentValue).toBe(killedValue);
    expect(sd.status).toBe("inactive");
  });


  it("onUpdate receives velocity", () => {
    const velocities: number[] = [];
    const sd = createSmoothDamp({
      from: () => 0,
      to: () => 100,
      smoothTime: 0.3,
      onUpdate: (_v, vel) => { velocities.push(vel); },
    });

    getTicker().update(16);

    expect(velocities.length).toBeGreaterThan(0);
    expect(velocities[0]).not.toBe(0);
    expect(sd.velocity).toBe(velocities[velocities.length - 1]);
    sd.kill();
  });

  it("uses maxSpeed to cap velocity", () => {
    const values: number[] = [];
    const sd = createSmoothDamp({
      from: () => 0,
      to: () => 1000,
      smoothTime: 0.1,
      maxSpeed: 10,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // Single large frame
    getTicker().update(16);

    // Should have moved at most maxSpeed * deltaTime ~ 10 * 0.016 = 0.16
    expect(sd.currentValue).toBeLessThan(1);
    sd.kill();
  });
});
