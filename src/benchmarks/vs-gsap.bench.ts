import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

/**
 * Benchmarks: anim-engine vs GSAP.
 *
 * Compares comparable operations via public APIs.
 * Each animation runs to natural completion (duration matches frame window).
 * No manual kill() — auto-cleanup measured.
 */
import { bench, describe } from "vitest";

import { createAnimation } from "../animation/create-animation";
import { cubicBezier } from "../easing/easing";
import { getTicker } from "../ticker/get-ticker";
import { createTimeline } from "../timeline/create-timeline";

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
    void a.play();
    advanceAnimEngineFrames(SINGLE_FRAMES);
    // animation auto-completes and unregisters from ticker
  });

  bench("gsap (internal)", () => {
    const target = { x: 0 };
    gsap.to(target, { x: 100, duration: SINGLE_DURATION_MS / 1000, ease: "power2.out" });
    advanceGSAPFrames(SINGLE_FRAMES);
    // tween auto-completes
  });

  bench("gsap (onUpdate)", () => {
    const target = { x: 0 };
    gsap.to(
      { x: 0 },
      {
        x: 100,
        duration: SINGLE_DURATION_MS / 1000,
        ease: "power2.out",
        onUpdate: function (this: { x: number }) {
          target.x = this.x;
        },
      },
    );
    advanceGSAPFrames(SINGLE_FRAMES);
  });
});

// ═══════════════════════════════════════════════════
//  LINEAR SINGLE TWEEN — no easing overhead
// ═══════════════════════════════════════════════════

describe("linear single tween (1000 frames to completion)", () => {
  bench("anim-engine", () => {
    const target = { x: 0 };
    const a = createAnimation({
      from: 0,
      to: 100,
      durationMs: SINGLE_DURATION_MS,
      ease: "linear",
      onUpdate: (v) => {
        target.x = v;
      },
    });
    void a.play();
    advanceAnimEngineFrames(SINGLE_FRAMES);
  });

  bench("gsap", () => {
    const target = { x: 0 };
    gsap.to(target, { x: 100, duration: SINGLE_DURATION_MS / 1000, ease: "none" });
    advanceGSAPFrames(SINGLE_FRAMES);
  });
});

// ═══════════════════════════════════════════════════
//  CUBIC BEZIER SINGLE TWEEN — custom bezier lookup
// ═══════════════════════════════════════════════════

// Build equivalent cubic bezier ease functions
const cbEase = cubicBezier(0.25, 0.1, 0.25, 1);
const gsapCbEase = CustomEase.create("cb-ease", "M0,0 C0.25,0.1 0.25,1 1,1");

// Pre-warm: ensure lookup/binary-search paths are compiled
cbEase(0.5);

describe("cubic bezier single tween (1000 frames to completion)", () => {
  bench("anim-engine", () => {
    const target = { x: 0 };
    const a = createAnimation({
      from: 0,
      to: 100,
      durationMs: SINGLE_DURATION_MS,
      ease: cbEase,
      onUpdate: (v) => {
        target.x = v;
      },
    });
    void a.play();
    advanceAnimEngineFrames(SINGLE_FRAMES);
  });

  bench("gsap", () => {
    const target = { x: 0 };
    gsap.to(target, { x: 100, duration: SINGLE_DURATION_MS / 1000, ease: gsapCbEase });
    advanceGSAPFrames(SINGLE_FRAMES);
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
        { value: 0 },
        { value: 50, gap: D * 0.3, ease: "outCubic" },
        { value: 80, gap: D * 0.4, ease: "inOutQuad" },
        { value: 100, gap: D * 0.3, ease: "outCubic" },
      ],
      onUpdate: (v) => {
        target.x = v;
      },
    });
    void a.play();
    advanceAnimEngineFrames(SINGLE_FRAMES);
  });

  bench("gsap: timeline", () => {
    const target = { x: 0 };
    const d = SINGLE_DURATION_MS / 1000;
    const tl = gsap.timeline();
    tl.to(target, { x: 50, duration: d * 0.3, ease: "power2.out" }, 0)
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
      void a.play();
    });
    advanceAnimEngineFrames(CONCURRENT_FRAMES);
  });

  bench("gsap (internal)", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    targets.forEach((t) => {
      gsap.to(t, { x: 100, duration: CONCURRENT_DURATION_MS / 1000, ease: "power2.out" });
    });
    advanceGSAPFrames(CONCURRENT_FRAMES);
  });

  bench("gsap (onUpdate)", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    targets.forEach((_t, i) => {
      gsap.to(
        { x: 0 },
        {
          x: 100,
          duration: CONCURRENT_DURATION_MS / 1000,
          ease: "power2.out",
          onUpdate: function (this: { x: number }) {
            targets[i].x = this.x;
          },
        },
      );
    });
    advanceGSAPFrames(CONCURRENT_FRAMES);
  });
});

// ═══════════════════════════════════════════════════
//  200 CONCURRENT TWEENS — all run to completion
// ═══════════════════════════════════════════════════

describe("200 concurrent tweens (500 frames to completion)", () => {
  bench("anim-engine", () => {
    const targets = Array.from({ length: 200 }, () => ({ x: 0 }));
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
      void a.play();
    });
    advanceAnimEngineFrames(CONCURRENT_FRAMES);
  });

  bench("gsap (internal)", () => {
    const targets = Array.from({ length: 200 }, () => ({ x: 0 }));
    targets.forEach((t) => {
      gsap.to(t, { x: 100, duration: CONCURRENT_DURATION_MS / 1000, ease: "power2.out" });
    });
    advanceGSAPFrames(CONCURRENT_FRAMES);
  });

  bench("gsap (onUpdate)", () => {
    const targets = Array.from({ length: 200 }, () => ({ x: 0 }));
    targets.forEach((_t, i) => {
      gsap.to(
        { x: 0 },
        {
          x: 100,
          duration: CONCURRENT_DURATION_MS / 1000,
          ease: "power2.out",
          onUpdate: function (this: { x: number }) {
            targets[i].x = this.x;
          },
        },
      );
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
          { value: 0 },
          { value: 50, gap: D * 0.3, ease: "outCubic" },
          { value: 80, gap: D * 0.4, ease: "inOutQuad" },
          { value: 100, gap: D * 0.3, ease: "outCubic" },
        ],
        onUpdate: (v) => {
          targets[i].x = v;
        },
      });
      void a.play();
    });
    advanceAnimEngineFrames(CONCURRENT_FRAMES);
  });

  bench("gsap", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    const d = CONCURRENT_DURATION_MS / 1000;
    targets.forEach((t) => {
      const tl = gsap.timeline();
      tl.to(t, { x: 50, duration: d * 0.3, ease: "power2.out" }, 0)
        .to(t, { x: 80, duration: d * 0.4, ease: "power1.inOut" }, d * 0.3)
        .to(t, { x: 100, duration: d * 0.3, ease: "power2.out" }, d * 0.7);
    });
    advanceGSAPFrames(CONCURRENT_FRAMES);
  });
});

// ═══════════════════════════════════════════════════
//  TIMELINE WITH 50 STAGGERED LAYERS — scheduler overhead
// ═══════════════════════════════════════════════════

describe("50-layer timeline (500 frames to completion)", () => {
  bench("anim-engine", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    const layers = targets.map((_t, i) => ({
      at: i * 10,
      animation: {
        keyframes: [{ value: 0 }, { value: 100, gap: CONCURRENT_DURATION_MS - i * 10 }],
        onUpdate: (v: number) => {
          targets[i].x = v;
        },
      },
    }));
    const tl = createTimeline(layers);
    void tl.play();
    advanceAnimEngineFrames(CONCURRENT_FRAMES);
  });

  bench("gsap", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    const tl = gsap.timeline();
    const d = CONCURRENT_DURATION_MS / 1000;
    targets.forEach((t, i) => {
      tl.to(t, { x: 100, duration: Math.max(d - i * 0.01, 0.01), ease: "power2.out" }, i * 0.01);
    });
    advanceGSAPFrames(CONCURRENT_FRAMES);
  });
});

// ═══════════════════════════════════════════════════
//  RE-PLAY — 50 tweens, play → complete → play again
// ═══════════════════════════════════════════════════

describe("50 tweens re-play (2 cycles, 500 frames each)", () => {
  bench("anim-engine", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    const anims = targets.map(() =>
      createAnimation({
        from: 0,
        to: 100,
        durationMs: CONCURRENT_DURATION_MS,
        ease: "outCubic",
      }),
    );
    for (let cycle = 0; cycle < 2; cycle++) {
      anims.forEach((a) => a.play());
      advanceAnimEngineFrames(CONCURRENT_FRAMES);
    }
  });

  bench("gsap", () => {
    const targets = Array.from({ length: 50 }, () => ({ x: 0 }));
    const tweens = targets.map((t) =>
      gsap.to(t, {
        x: 100,
        duration: CONCURRENT_DURATION_MS / 1000,
        ease: "power2.out",
        paused: true,
      }),
    );
    for (let cycle = 0; cycle < 2; cycle++) {
      tweens.forEach((tw) => tw.restart());
      advanceGSAPFrames(CONCURRENT_FRAMES);
    }
  });
});

// ═══════════════════════════════════════════════════
//  DIAGNOSTIC — raw runner calls vs ticker
// ═══════════════════════════════════════════════════

import { createTweenRunner } from "../animation/runner";
import type { EaseFunction } from "../shared-types";

const testEase: EaseFunction = (t) => 1 - Math.pow(1 - t, 3); // outCubic equivalent

describe("200 concurrent raw runner calls (500 frames, no ticker)", () => {
  bench("anim-engine (raw runner)", () => {
    const targets = Array.from({ length: 200 }, () => ({ x: 0 }));
    const runners = targets.map(() =>
      createTweenRunner({
        from: 0,
        to: 100,
        durationMs: CONCURRENT_DURATION_MS,
        easeFn: testEase,
        onUpdate: (_v) => {},
        onEnded: () => {},
      }),
    );
    for (let f = 0; f < CONCURRENT_FRAMES; f++) {
      for (let i = 0; i < runners.length; i++) {
        runners[i](DT);
      }
    }
  });

  bench("anim-engine (via ticker)", () => {
    const targets = Array.from({ length: 200 }, () => ({ x: 0 }));
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
      void a.play();
    });
    advanceAnimEngineFrames(CONCURRENT_FRAMES);
  });
});

describe("200 concurrent tweens — worst case (all dynamic values)", () => {
  bench("anim-engine (dynamic)", () => {
    const targets = Array.from({ length: 200 }, () => ({ x: 0 }));
    targets.forEach((_t, i) => {
      const a = createAnimation({
        from: () => 0,
        to: () => 100,
        durationMs: () => CONCURRENT_DURATION_MS,
        ease: "outCubic",
        onUpdate: (v) => {
          targets[i].x = v;
        },
      });
      void a.play();
    });
    advanceAnimEngineFrames(CONCURRENT_FRAMES);
  });

  bench("gsap (internal)", () => {
    const targets = Array.from({ length: 200 }, () => ({ x: 0 }));
    targets.forEach((t) => {
      gsap.to(t, { x: 100, duration: CONCURRENT_DURATION_MS / 1000, ease: "power2.out" });
    });
    advanceGSAPFrames(CONCURRENT_FRAMES);
  });
});

// ═══════════════════════════════════════════════════
//  1000 CONCURRENT TWEENS — stress test
// ═══════════════════════════════════════════════════

describe("1000 concurrent tweens (500 frames to completion)", () => {
  bench("anim-engine", () => {
    const targets = Array.from({ length: 1000 }, () => ({ x: 0 }));
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
      void a.play();
    });
    advanceAnimEngineFrames(CONCURRENT_FRAMES);
  });

  bench("gsap (internal)", () => {
    const targets = Array.from({ length: 1000 }, () => ({ x: 0 }));
    targets.forEach((t) => {
      gsap.to(t, { x: 100, duration: CONCURRENT_DURATION_MS / 1000, ease: "power2.out" });
    });
    advanceGSAPFrames(CONCURRENT_FRAMES);
  });
});

import { updateTween } from "../animation/update";
import type { TweenState } from "../animation/update";

describe("200 concurrent raw updateTween calls (500 frames, no runner)", () => {
  bench("raw math only", () => {
    const states: TweenState[] = Array.from({ length: 200 }, () => ({
      progress: 0,
      currentValue: 0,
      velocity: 0,
    }));
    for (let f = 0; f < CONCURRENT_FRAMES; f++) {
      for (let i = 0; i < states.length; i++) {
        updateTween(states[i], DT, CONCURRENT_DURATION_MS, testEase, 0, 100);
      }
    }
  });

  bench("raw runner (no callback)", () => {
    const runners = Array.from({ length: 200 }, () =>
      createTweenRunner({
        from: 0,
        to: 100,
        durationMs: CONCURRENT_DURATION_MS,
        easeFn: testEase,
        onEnded: () => {},
      }),
    );
    for (let f = 0; f < CONCURRENT_FRAMES; f++) {
      for (let i = 0; i < runners.length; i++) {
        runners[i](DT);
      }
    }
  });
});
