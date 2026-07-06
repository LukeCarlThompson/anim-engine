/**
 * Benchmarks: easing function throughput.
 *
 * Isolates the easing call from animation lifecycle overhead so we can
 * measure micro-optimisations directly.
 *
 * Each benchmark calls the easing function 10,000 times per sample.
 */
import { bench, describe } from "vitest";

import { EASING_FUNCTIONS } from "../domain";

const FRAMES = 10_000;

// ── Already optimised (no pow) — baseline ──

describe("easing: inCubic", () => {
  bench("inCubic (multiply baseline)", () => {
    const fn = EASING_FUNCTIONS.inCubic;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

// ── Converted from pow to multiply ──

describe("easing: outCubic", () => {
  bench("outCubic", () => {
    const fn = EASING_FUNCTIONS.outCubic;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

describe("easing: outQuart", () => {
  bench("outQuart", () => {
    const fn = EASING_FUNCTIONS.outQuart;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

describe("easing: outQuint", () => {
  bench("outQuint", () => {
    const fn = EASING_FUNCTIONS.outQuint;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

// ── Still using pow — candidates ──

describe("easing: inCirc", () => {
  bench("inCirc", () => {
    const fn = EASING_FUNCTIONS.inCirc;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

describe("easing: outCirc", () => {
  bench("outCirc", () => {
    const fn = EASING_FUNCTIONS.outCirc;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

describe("easing: inOutCirc", () => {
  bench("inOutCirc", () => {
    const fn = EASING_FUNCTIONS.inOutCirc;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

describe("easing: outBack", () => {
  bench("outBack", () => {
    const fn = EASING_FUNCTIONS.outBack;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

describe("easing: inOutBack", () => {
  bench("inOutBack", () => {
    const fn = EASING_FUNCTIONS.inOutBack;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});
