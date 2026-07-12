import { describe, it, expect } from "vitest";

import { getTicker } from "../ticker";
import { createInertia } from "./create-inertia";

describe("createInertia", () => {
  it("GIVEN track is called THEN value is set immediately", () => {
    // GIVEN
    const inertia = createInertia({ decelerationMs: 300 });

    // WHEN
    inertia.track(100);
    getTicker().update(16);

    // THEN
    expect(inertia.value).toBe(100);
  });

  it("GIVEN track is called twice THEN velocity reflects frame-to-frame delta", () => {
    // GIVEN
    const inertia = createInertia({ decelerationMs: 300 });
    inertia.track(0);
    getTicker().update(16);

    // WHEN — second track with position change
    inertia.track(100);
    getTicker().update(16);

    // THEN — velocity ~ (100 - 0) / 0.016s ≈ 6250 px/s
    expect(inertia.velocity).toBeGreaterThan(5000);
  });

  it("GIVEN track then release THEN value coasts further than last tracked position", () => {
    // GIVEN
    const values: number[] = [];
    const inertia = createInertia({
      decelerationMs: 400,
      onUpdate: (v) => {
        values.push(v);
      },
    });

    // WHEN — build velocity across a few frames
    inertia.track(0);
    getTicker().update(16);
    inertia.track(50);
    getTicker().update(16);
    inertia.track(120);
    getTicker().update(16);
    const lastTracked = inertia.value;

    // WHEN — release and coast
    inertia.release();
    for (let i = 0; i < 200; i++) getTicker().update(16);

    // THEN — coasted further than the last tracked position
    expect(inertia.value).toBeGreaterThan(lastTracked);
  });

  it("GIVEN track at same position with no velocity WHEN released THEN value stays at tracked position", () => {
    // GIVEN
    const inertia = createInertia({ decelerationMs: 300 });
    inertia.track(50);
    getTicker().update(16);

    // WHEN — no velocity, release
    inertia.release();
    getTicker().update(16);
    getTicker().update(16);

    // THEN
    expect(inertia.value).toBe(50);
  });

  it("GIVEN release with no prior tracking THEN inertia does nothing", () => {
    // GIVEN
    const inertia = createInertia({ decelerationMs: 300 });

    // WHEN — release without any track call
    inertia.release();
    getTicker().update(16);

    // THEN — value stays at 0
    expect(inertia.value).toBe(0);
    expect(inertia.status).toBe("inactive");
  });

  it("GIVEN setValue is called THEN it teleports value and resets velocity", () => {
    // GIVEN
    const inertia = createInertia({ decelerationMs: 300 });
    inertia.track(0);
    getTicker().update(16);
    inertia.track(100);
    getTicker().update(16);

    // WHEN
    inertia.setValue(200);

    // THEN
    expect(inertia.value).toBe(200);
    expect(inertia.velocity).toBe(0);
    expect(inertia.status).toBe("inactive");
  });

  it("GIVEN an inertia with onEnded WHEN coasting settles THEN onEnded fires once", () => {
    // GIVEN
    let endedCount = 0;
    const inertia = createInertia({
      decelerationMs: 100,
      precision: 0.01,
      onEnded: () => {
        endedCount++;
      },
    });

    // WHEN — track then release
    inertia.track(100);
    getTicker().update(16);
    inertia.release();
    for (let i = 0; i < 300; i++) getTicker().update(16);

    // THEN
    expect(endedCount).toBe(1);
  });

  it("GIVEN coasting settles THEN re-track and release fires onEnded again", () => {
    // GIVEN
    let endedCount = 0;
    const inertia = createInertia({
      decelerationMs: 100,
      precision: 0.01,
      onEnded: () => {
        endedCount++;
      },
    });

    // WHEN — first track/release/coast cycle
    inertia.track(80);
    getTicker().update(16);
    inertia.release();
    for (let i = 0; i < 300; i++) getTicker().update(16);
    expect(endedCount).toBe(1); // sanity check

    // WHEN — re-track and release again
    inertia.track(160);
    getTicker().update(16);
    inertia.release();
    for (let i = 0; i < 300; i++) getTicker().update(16);

    // THEN
    expect(endedCount).toBe(2);
  });

  it("GIVEN dynamic decelerationMs WHEN coasting THEN it uses the current resolved value", () => {
    // GIVEN — fast deceleration
    const valuesFast: number[] = [];
    const fast = createInertia({
      decelerationMs: 500,
      onUpdate: (v) => {
        valuesFast.push(v);
      },
    });
    fast.track(0);
    getTicker().update(16);
    fast.track(100);
    getTicker().update(16);
    fast.release();
    for (let i = 0; i < 200; i++) getTicker().update(16);
    const fastEnd = fast.value;

    // GIVEN — slow deceleration
    const valuesSlow: number[] = [];
    const slow = createInertia({
      decelerationMs: 800,
      onUpdate: (v) => {
        valuesSlow.push(v);
      },
    });
    slow.track(0);
    getTicker().update(16);
    slow.track(100);
    getTicker().update(16);
    slow.release();
    for (let i = 0; i < 200; i++) getTicker().update(16);
    const slowEnd = slow.value;

    // THEN — slower decel coasts further
    expect(slowEnd).toBeGreaterThan(fastEnd);
  });

  it("GIVEN inertia is coasting WHEN status is checked THEN it returns 'active'", () => {
    // GIVEN — build velocity across two frames
    const inertia = createInertia({ decelerationMs: 300 });
    inertia.track(0);
    getTicker().update(16);
    inertia.track(100);
    getTicker().update(16);

    // WHEN — release
    inertia.release();
    getTicker().update(16);

    // THEN
    expect(inertia.status).toBe("active");
  });

  it("GIVEN inertia has settled WHEN status is checked THEN it returns 'inactive'", () => {
    // GIVEN
    const inertia = createInertia({
      decelerationMs: 100,
      precision: 1,
    });
    inertia.track(100);
    getTicker().update(16);
    inertia.release();
    for (let i = 0; i < 300; i++) getTicker().update(16);

    // THEN
    expect(inertia.status).toBe("inactive");
  });
});
