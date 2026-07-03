/**
 * Benchmarks: anim-engine vs GSAP.
 *
 * Compares comparable operations via public APIs.
 * Each animation runs to natural completion (duration matches frame window).
 * No manual kill() — auto-cleanup measured.
 */
import { bench, describe } from "vitest";
import { createAnimation } from "../animation/create-animation";
import { getTicker } from "../ticker/get-ticker";
import gsap from "gsap";

// ─── Constants ───

const DT = 16.67; // ~60fps frame delta in ms
const DT_SECONDS = DT / 1000;
const SINGLE_FRAMES = 1000;
const SINGLE_DURATION_MS = SINGLE_FRAMES * DT; // ~16,670ms
const CONCURRENT_FRAMES = 500;
const CONCURRENT_DURATION_MS = CONCURRENT_FRAMES * DT; // ~8,335ms

// ─── Helpers ───

const ticker = getTicker(); // cache singleton

const advanceAnimEngineFrames = (frames: number): void => {
  for (let i = 0; i < frames; i++) {
    ticker.update(DT);
  }
};

gsap.ticker.remove(gsap.updateRoot); // disable GSAP's internal ticker

let cumulativeTime = 0;
const advanceGSAPFrames = (frames: number): void => {
  for (let i = 0; i < frames; i++) {
    cumulativeTime += DT_SECONDS;
    gsap.updateRoot(cumulativeTime);
  }
};

// ═══════════════════════════════════════════════════
//  SINGLE TWEEN — runs to natural completion
// ═══════════════════════════════════════════════════

describe("single tween (1000 frames to completion)", () => {
  bench("anim-engine", () => {
    const target = { x: 0 };
    const a = createAnimation({
      from: 0,
      to: 100,
      durationMs: SINGLE_DURATION_MS,
      ease: "outCubic",
      onUpdate: (v) => {
        target.x = v;
      },
    });
    a.play();
    advanceAnimEngineFrames(SINGLE_FRAMES);
    // animation auto-completes and unregisters from ticker
  });

  bench("gsap", () => {
    const target = { x: 0 };
    gsap.to(target, { x: 100, duration: SINGLE_DURATION_MS / 1000, ease: "power3.out" });
    advanceGSAPFrames(SINGLE_FRAMES);
    // tween auto-completes
  });
});

// ═══════════════════════════════════════════════════
//  SINGLE KEYFRAME — 3 segments to completion
// ═══════════════════════════════════════════════════

describe("keyframe animation (3 segments, 1000 frames to completion)", () => {
  const D = SINGLE_DURATION_MS;

  bench("anim-engine: keyframes", () => {
    const target = { x: 0 };
    const a = createAnimation({
      keyframes: [
        { at: 0, value: 0 },
        { at: D * 0.3, value: 50, ease: "outCubic" },
        { at: D * 0.7, value: 80, ease: "inOutQuad" },
        { at: D, value: 100, ease: "outCubic" },
      ],
      onUpdate: (v) => {
        target.x = v;
      },
    });
    a.play();
    advanceAnimEngineFrames(SINGLE_FRAMES);
  });

  bench("gsap: timeline", () => {
    const target = { x: 0 };
    const d = SINGLE_DURATION_MS / 1000;
    const tl = gsap.timeline();
    tl.to(target, { x: 50, duration: d * 0.3, ease: "power3.out" }, 0)
      .to(target, { x: 80, duration: d * 0.4, ease: "power1.inOut" }, d * 0.3)
      .to(target, { x: 100, duration: d * 0.3, ease: "power2.out" }, d * 0.7);
    advanceGSAPFrames(SINGLE_FRAMES);
  });
});

// ═══════════════════════════════════════════════════
//  50 CONCURRENT TWEENS — all run to completion
// ═══════════════════════════════════════════════════

describe("50 concurrent tweens (500 frames to completion)", () => {
  bench("anim-engine", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    targets.forEach((_t, i) => {
      const a = createAnimation({
        from: 0,
        to: 100,
        durationMs: CONCURRENT_DURATION_MS,
        ease: "outCubic",
        onUpdate: (v) => {
          targets[i].x = v;
        },
      });
      a.play();
    });
    advanceAnimEngineFrames(CONCURRENT_FRAMES);
  });

  bench("gsap", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    targets.forEach((t) => {
      gsap.to(t, { x: 100, duration: CONCURRENT_DURATION_MS / 1000, ease: "power3.out" });
    });
    advanceGSAPFrames(CONCURRENT_FRAMES);
  });
});

// ═══════════════════════════════════════════════════
//  50 CONCURRENT KEYFRAME ANIMATIONS — all run to completion
// ═══════════════════════════════════════════════════

describe("50 concurrent keyframe animations (500 frames to completion)", () => {
  const D = CONCURRENT_DURATION_MS;

  bench("anim-engine", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    targets.forEach((_t, i) => {
      const a = createAnimation({
        keyframes: [
          { at: 0, value: 0 },
          { at: D * 0.3, value: 50, ease: "outCubic" },
          { at: D * 0.7, value: 80, ease: "inOutQuad" },
          { at: D, value: 100, ease: "outCubic" },
        ],
        onUpdate: (v) => {
          targets[i].x = v;
        },
      });
      a.play();
    });
    advanceAnimEngineFrames(CONCURRENT_FRAMES);
  });

  bench("gsap", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    const d = CONCURRENT_DURATION_MS / 1000;
    targets.forEach((t) => {
      const tl = gsap.timeline();
      tl.to(t, { x: 50, duration: d * 0.3, ease: "power3.out" }, 0)
        .to(t, { x: 80, duration: d * 0.4, ease: "power1.inOut" }, d * 0.3)
        .to(t, { x: 100, duration: d * 0.3, ease: "power2.out" }, d * 0.7);
    });
    advanceGSAPFrames(CONCURRENT_FRAMES);
  });
});
