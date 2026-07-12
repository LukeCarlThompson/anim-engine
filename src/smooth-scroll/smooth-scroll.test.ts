import { describe, it, expect } from "vitest";

import { getTicker } from "../ticker";
import { createSmoothScroll } from "./create-smooth-scroll";

describe("createSmoothScroll", () => {
  it("GIVEN no input THEN value stays at 0", () => {
    // GIVEN
    const scroll = createSmoothScroll({ smoothTimeMs: 50 });

    // WHEN — a few frames pass (update never registers without addDelta)
    for (let i = 0; i < 10; i++) getTicker().update(16);

    // THEN — initial value is 0
    expect(scroll.value).toBe(0);
    expect(scroll.status).toBe("inactive");
  });

  it("GIVEN addDelta is called THEN value chases the target", () => {
    // GIVEN
    const values: number[] = [];
    const scroll = createSmoothScroll({
      smoothTimeMs: 30,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // WHEN
    scroll.addDelta(100);
    for (let i = 0; i < 30; i++) getTicker().update(16);

    // THEN — value approaches 100
    expect(scroll.value).toBeGreaterThan(90);
  });

  it("GIVEN addDelta with bounds THEN target is clamped", () => {
    // GIVEN
    const scroll = createSmoothScroll({
      smoothTimeMs: 30,
      min: 0,
      max: 200,
    });

    // WHEN — add delta past max bound
    scroll.addDelta(500);
    for (let i = 0; i < 30; i++) getTicker().update(16);

    // THEN — value clamped at max
    expect(scroll.value).toBeLessThanOrEqual(200 + 0.01);
  });

  it("GIVEN setValue is called THEN value and target sync instantly", () => {
    // GIVEN
    const scroll = createSmoothScroll({ smoothTimeMs: 30 });
    scroll.addDelta(100);
    getTicker().update(16);

    // WHEN
    scroll.setValue(50);

    // THEN
    expect(scroll.value).toBe(50);
  });

  it("GIVEN addDelta is called after setValue THEN delta is relative to set value", () => {
    // GIVEN
    const scroll = createSmoothScroll({ smoothTimeMs: 30, min: 0, max: 500 });
    scroll.addDelta(100);
    for (let i = 0; i < 30; i++) getTicker().update(16);

    // WHEN — re-sync and add more
    scroll.setValue(scroll.value);
    scroll.addDelta(50);
    for (let i = 0; i < 30; i++) getTicker().update(16);

    // THEN — value coasts further from the re-synced position
    expect(scroll.value).toBeGreaterThan(130);
  });

  it("GIVEN addDelta past bounds WHEN scrolling back THEN no dead zone", () => {
    // GIVEN
    const scroll = createSmoothScroll({
      smoothTimeMs: 30,
      min: 0,
      max: 200,
    });

    // WHEN — overshoot to 500 (clamped to 200), value settles at 200
    scroll.addDelta(500);
    for (let i = 0; i < 60; i++) getTicker().update(16);
    expect(scroll.value).toBeLessThanOrEqual(200);

    // WHEN — scroll back by 50
    scroll.addDelta(-50);
    for (let i = 0; i < 30; i++) getTicker().update(16);

    // THEN — value should be near 150, not stuck at 200
    expect(scroll.value).toBeLessThan(180);
  });

  it("GIVEN status WHEN coasting THEN returns 'active'", () => {
    // GIVEN
    const scroll = createSmoothScroll({ smoothTimeMs: 200, precision: 0.1 });
    scroll.addDelta(100);
    getTicker().update(16);

    // THEN
    expect(scroll.status).toBe("active");
  });

  it("GIVEN status WHEN settled THEN returns 'inactive'", () => {
    // GIVEN
    const scroll = createSmoothScroll({
      smoothTimeMs: 10,
      precision: 10,
    });
    scroll.addDelta(100);
    for (let i = 0; i < 100; i++) getTicker().update(16);

    // THEN
    expect(scroll.status).toBe("inactive");
  });

  it("GIVEN onEnded WHEN coasting settles THEN it fires once", () => {
    // GIVEN
    let count = 0;
    const scroll = createSmoothScroll({
      smoothTimeMs: 10,
      precision: 10,
      onEnded: () => {
        count++;
      },
    });

    // WHEN
    scroll.addDelta(50);
    for (let i = 0; i < 100; i++) getTicker().update(16);

    // THEN
    expect(count).toBe(1);
  });
});
