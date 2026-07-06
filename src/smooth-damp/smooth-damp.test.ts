import { describe, it, expect } from "vitest";

import { getTicker } from "../ticker";
import { createSmoothDamp } from "./create-smooth-damp";

describe("createSmoothDamp", () => {
  it("GIVEN a smooth damp with a static target WHEN updated over time THEN it approaches the target value", () => {
    // GIVEN
    let target = 0;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTimeMs: 300,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // WHEN
    target = 100;
    for (let i = 0; i < 120; i++) {
      getTicker().update(16);
    }

    // THEN
    expect(values.length).toBeGreaterThan(10);
    expect(values[values.length - 1]).toBeGreaterThan(97);
    sd.kill();
  });

  it("GIVEN a smooth damp chasing a dynamic target WHEN the target changes mid-way THEN it follows the new target", () => {
    // GIVEN
    let target = 100;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTimeMs: 500,
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
    expect(values[values.length - 1]).toBeGreaterThan(150);
    sd.kill();
  });

  it("GIVEN a smooth damp without explicit starting value WHEN created THEN value defaults to the target", () => {
    // GIVEN / WHEN
    const sd = createSmoothDamp({
      to: () => 100,
      smoothTimeMs: 300,
    });

    // THEN
    expect(sd.value).toBe(100);
    sd.kill();
  });

  it("GIVEN a smooth damp WHEN setValue is called before the first tick THEN it sets the initial position", () => {
    // GIVEN / WHEN
    const sd = createSmoothDamp({
      to: () => 100,
      smoothTimeMs: 300,
    });
    sd.setValue(50);

    // THEN
    expect(sd.value).toBe(50);
    sd.kill();
  });

  it("GIVEN a running smooth damp WHEN setValue is called THEN it teleports the value instantly", () => {
    // GIVEN
    let target = 0;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTimeMs: 1000,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // WHEN
    target = 100;
    getTicker().update(16);
    sd.setValue(500);

    // THEN
    expect(sd.value).toBe(500);
    sd.kill();
  });

  it("GIVEN a running smooth damp WHEN stopped THEN it pauses and WHEN started THEN it resumes", () => {
    // GIVEN
    let target = 0;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTimeMs: 200,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    target = 100;
    for (let i = 0; i < 10; i++) getTicker().update(16);
    const before = sd.value;

    // WHEN — stop
    sd.stop();
    for (let i = 0; i < 10; i++) getTicker().update(16);

    // THEN — paused
    expect(sd.value).toBe(before);

    // WHEN — resume
    sd.start();
    for (let i = 0; i < 10; i++) getTicker().update(16);

    // THEN — progressing again
    expect(sd.value).toBeGreaterThan(before);
    sd.kill();
  });

  it("GIVEN a running smooth damp WHEN killed THEN it stops updating and becomes inactive", () => {
    // GIVEN
    let target = 0;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTimeMs: 300,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    target = 100;
    getTicker().update(16);

    // WHEN
    sd.kill();
    const killedValue = sd.value;
    getTicker().update(16);

    // THEN
    expect(sd.value).toBe(killedValue);
    expect(sd.status).toBe("inactive");
  });

  it("GIVEN a smooth damp with onUpdate velocity callback WHEN it moves THEN velocity is reported correctly", () => {
    // GIVEN
    let target = 0;
    const velocities: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTimeMs: 300,
      onUpdate: (_v, vel) => {
        velocities.push(vel);
      },
    });

    // WHEN
    target = 100;
    getTicker().update(16);

    // THEN
    expect(velocities.length).toBeGreaterThan(0);
    expect(velocities[0]).toBeCloseTo(63.93, 1);
    expect(sd.velocity).toBe(velocities[velocities.length - 1]);
    sd.kill();
  });

  it("GIVEN a smooth damp with onEnded callback WHEN it settles on the target THEN onEnded fires", () => {
    // GIVEN
    let target = 0;
    let ended = false;
    const sd = createSmoothDamp({
      to: () => target,
      smoothTimeMs: 300,
      precision: 0.01,
      onEnded: () => {
        ended = true;
      },
    });

    // WHEN
    target = 100;
    for (let i = 0; i < 300; i++) {
      getTicker().update(16);
    }

    // THEN
    expect(ended).toBe(true);
    expect(sd.value).toBeCloseTo(100, 0);
    sd.kill();
  });

  it("GIVEN a smooth damp with maxSpeed WHEN a large frame update occurs THEN velocity is capped", () => {
    // GIVEN
    let target = 0;
    const values: number[] = [];
    const sd = createSmoothDamp({
      to: () => target,
      smoothTimeMs: 100,
      maxSpeed: 10,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // WHEN — single large step toward a far target
    target = 1000;
    getTicker().update(16);

    // THEN — should have moved at most maxSpeed * deltaTime ~ 10 * 0.016 = 0.16
    expect(sd.value).toBeLessThan(1);
    sd.kill();
  });
});
