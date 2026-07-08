/**
 * A function that maps a progress value `t` in [0, 1] to an eased output value.
 * Values outside [0, 1] may be returned for overshooting easings like elastic or back.
 */
export type EaseFunction = (t: number) => number;

/**
 * Resolves an easing identifier or function into a concrete {@link EaseFunction}.
 * If a function is passed, it is returned as-is. If a name is passed, the
 * corresponding built-in easing function is looked up.
 *
 * @param ease - An easing name or a custom easing function.
 * @returns The resolved easing function.
 */
export const resolveEasing = (ease: EaseName | EaseFunction): EaseFunction =>
  typeof ease === "function" ? ease : EASING_FUNCTIONS[ease];

// Module-scope constants — computed once, not per frame
const pow = Math.pow;
const sqrt = Math.sqrt;
const sin = Math.sin;
const cos = Math.cos;
const PI = Math.PI;
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * PI) / 3;
const c5 = (2 * PI) / 4.5;

const bounceOut: EaseFunction = (x) => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
};

/** All 31 named easing identifiers, ordered by type. */
export const EASE_NAMES = [
  "linear",
  "inQuad",
  "outQuad",
  "inOutQuad",
  "inCubic",
  "outCubic",
  "inOutCubic",
  "inQuart",
  "outQuart",
  "inOutQuart",
  "inQuint",
  "outQuint",
  "inOutQuint",
  "inSine",
  "outSine",
  "inOutSine",
  "inExpo",
  "outExpo",
  "inOutExpo",
  "inCirc",
  "outCirc",
  "inOutCirc",
  "inBack",
  "outBack",
  "inOutBack",
  "inElastic",
  "outElastic",
  "inOutElastic",
  "inBounce",
  "outBounce",
  "inOutBounce",
] as const;

export type EaseName = (typeof EASE_NAMES)[number];

export const EASING_FUNCTIONS: Record<EaseName, EaseFunction> = {
  linear: (x) => x,

  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2),

  inCubic: (x) => x * x * x,
  outCubic: (x) => {
    const t = 1 - x;
    return 1 - t * t * t;
  },
  inOutCubic: (x) => {
    if (x < 0.5) return 4 * x * x * x;
    const t = -2 * x + 2;
    return 1 - (t * t * t) / 2;
  },

  inQuart: (x) => x * x * x * x,
  outQuart: (x) => {
    const t = 1 - x;
    const t2 = t * t;
    return 1 - t2 * t2;
  },
  inOutQuart: (x) => {
    if (x < 0.5) return 8 * x * x * x * x;
    const t = -2 * x + 2;
    return 1 - (t * t * t * t) / 2;
  },

  inQuint: (x) => x * x * x * x * x,
  outQuint: (x) => {
    const t = 1 - x;
    const t2 = t * t;
    return 1 - t2 * t2 * t;
  },
  inOutQuint: (x) => {
    if (x < 0.5) return 16 * x * x * x * x * x;
    const t = -2 * x + 2;
    return 1 - (t * t * t * t * t) / 2;
  },

  inSine: (x) => 1 - cos((x * PI) / 2),
  outSine: (x) => sin((x * PI) / 2),
  inOutSine: (x) => -(cos(PI * x) - 1) / 2,

  inExpo: (x) => (x === 0 ? 0 : pow(2, 10 * x - 10)),
  outExpo: (x) => (x === 1 ? 1 : 1 - pow(2, -10 * x)),
  inOutExpo: (x) =>
    x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2,

  inCirc: (x) => 1 - sqrt(1 - x * x),
  outCirc: (x) => sqrt(1 - (x - 1) * (x - 1)),
  inOutCirc: (x) =>
    x < 0.5 ? (1 - sqrt(1 - 4 * x * x)) / 2 : (sqrt(1 - 4 * (x - 1) * (x - 1)) + 1) / 2,

  inBack: (x) => c3 * x * x * x - c1 * x * x,
  outBack: (x) => {
    const t = x - 1;
    return 1 + c3 * t * t * t + c1 * t * t;
  },
  inOutBack: (x) =>
    x < 0.5
      ? (4 * x * x * ((c2 + 1) * 2 * x - c2)) / 2
      : (4 * (x - 1) * (x - 1) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2,

  inElastic: (x) => (x === 0 ? 0 : x === 1 ? 1 : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4)),
  outElastic: (x) => (x === 0 ? 0 : x === 1 ? 1 : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1),
  inOutElastic: (x) =>
    x === 0
      ? 0
      : x === 1
        ? 1
        : x < 0.5
          ? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2
          : (pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5)) / 2 + 1,

  inBounce: (x) => 1 - bounceOut(1 - x),
  outBounce: bounceOut,
  inOutBounce: (x) => (x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2),
};

/**
 * Cubic bezier easing. Builds a pre-computed lookup table at construction time
 * for O(log n) binary search at runtime — no Newton iteration, no allocation
 * per frame.
 *
 * @param p1x - First control point x coordinate.
 * @param p1y - First control point y coordinate.
 * @param p2x - Second control point x coordinate.
 * @param p2y - Second control point y coordinate.
 * @returns An EaseFunction suitable for use with animate() or createTimeline().
 */
export const cubicBezier = (p1x: number, p1y: number, p2x: number, p2y: number): EaseFunction => {
  // Pre-compute sample points: (x, y) pairs at evenly-spaced t values
  const sampleSize = 64;
  const samplesX = new Float64Array(sampleSize);
  const samplesY = new Float64Array(sampleSize);

  for (let index = 0; index < sampleSize; index++) {
    const t = index / (sampleSize - 1);
    const tInv = 1 - t;

    // Cubic bezier evaluation: B(t) = 3*(1-t)²*t*P1 + 3*(1-t)*t²*P2 + t³*P3
    const tInvSq = tInv * tInv;
    const tSq = t * t;

    samplesX[index] = 3 * tInvSq * t * p1x + 3 * tInv * tSq * p2x + tSq * t;
    samplesY[index] = 3 * tInvSq * t * p1y + 3 * tInv * tSq * p2y + tSq * t;
  }

  return (x: number): number => {
    // Edge cases
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    // Binary search for the two nearest samples bracketing x
    let low = 0;
    let high = sampleSize - 1;

    while (high - low > 1) {
      const mid = (low + high) >>> 1;
      if (samplesX[mid] <= x) {
        low = mid;
      } else {
        high = mid;
      }
    }

    // Linear interpolate y between the two bracketing samples
    const xLow = samplesX[low];
    const xHigh = samplesX[high];
    const fraction = (x - xLow) / (xHigh - xLow);

    const yLow = samplesY[low];
    const yHigh = samplesY[high];

    return yLow + fraction * (yHigh - yLow);
  };
};
