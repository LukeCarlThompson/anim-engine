import { EASING_FUNCTIONS } from "../domain";
/**
 * Benchmarks: easing function throughput.
 *
 * Isolates the easing call from animation lifecycle overhead so we can
 * measure micro-optimisations directly.
 *
 * Each benchmark calls the easing function 10,000 times per sample.
 */
import { benchGroup } from "./bench-group";

const FRAMES = 10_000;

// ── Already optimised (no pow) — baseline ──

benchGroup("easing: inCubic", (bench) => {
  bench("inCubic (multiply baseline)", () => {
    const fn = EASING_FUNCTIONS.inCubic;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

// ── Converted from pow to multiply ──

benchGroup("easing: outCubic", (bench) => {
  bench("outCubic", () => {
    const fn = EASING_FUNCTIONS.outCubic;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

benchGroup("easing: outQuart", (bench) => {
  bench("outQuart", () => {
    const fn = EASING_FUNCTIONS.outQuart;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

benchGroup("easing: outQuint", (bench) => {
  bench("outQuint", () => {
    const fn = EASING_FUNCTIONS.outQuint;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

// ── Still using pow — candidates ──

benchGroup("easing: inCirc", (bench) => {
  bench("inCirc", () => {
    const fn = EASING_FUNCTIONS.inCirc;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

benchGroup("easing: outCirc", (bench) => {
  bench("outCirc", () => {
    const fn = EASING_FUNCTIONS.outCirc;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

benchGroup("easing: inOutCirc", (bench) => {
  bench("inOutCirc", () => {
    const fn = EASING_FUNCTIONS.inOutCirc;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

benchGroup("easing: outBack", (bench) => {
  bench("outBack", () => {
    const fn = EASING_FUNCTIONS.outBack;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});

benchGroup("easing: inOutBack", (bench) => {
  bench("inOutBack", () => {
    const fn = EASING_FUNCTIONS.inOutBack;
    let sum = 0;
    for (let i = 0; i < FRAMES; i++) sum += fn(i / FRAMES);
    if (sum === -1) throw new Error("impossible");
  });
});
