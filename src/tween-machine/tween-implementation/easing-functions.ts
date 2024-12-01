import { EaseName } from "../tween-machine";

export type EaseFunction = (progress: number) => number;

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

export type EasingDictionary = Record<EaseName, EaseFunction>;

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

const bounceOut: EaseFunction = function (x) {
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

export const easingFunctions: EasingDictionary = {
  linear: (x) => x,
  inQuad: function (x) {
    return x * x;
  },
  outQuad: function (x) {
    return 1 - (1 - x) * (1 - x);
  },
  inOutQuad: function (x) {
    return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2;
  },
  inCubic: function (x) {
    return x * x * x;
  },
  outCubic: function (x) {
    return 1 - pow(1 - x, 3);
  },
  inOutCubic: function (x) {
    return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
  },
  inQuart: function (x) {
    return x * x * x * x;
  },
  outQuart: function (x) {
    return 1 - pow(1 - x, 4);
  },
  inOutQuart: function (x) {
    return x < 0.5 ? 8 * x * x * x * x : 1 - pow(-2 * x + 2, 4) / 2;
  },
  inQuint: function (x) {
    return x * x * x * x * x;
  },
  outQuint: function (x) {
    return 1 - pow(1 - x, 5);
  },
  inOutQuint: function (x) {
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - pow(-2 * x + 2, 5) / 2;
  },
  inSine: function (x) {
    return 1 - cos((x * PI) / 2);
  },
  outSine: function (x) {
    return sin((x * PI) / 2);
  },
  inOutSine: function (x) {
    return -(cos(PI * x) - 1) / 2;
  },
  inExpo: function (x) {
    return x === 0 ? 0 : pow(2, 10 * x - 10);
  },
  outExpo: function (x) {
    return x === 1 ? 1 : 1 - pow(2, -10 * x);
  },
  inOutExpo: function (x) {
    return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2;
  },
  inCirc: function (x) {
    return 1 - sqrt(1 - pow(x, 2));
  },
  outCirc: function (x) {
    return sqrt(1 - pow(x - 1, 2));
  },
  inOutCirc: function (x) {
    return x < 0.5 ? (1 - sqrt(1 - pow(2 * x, 2))) / 2 : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2;
  },
  inBack: function (x) {
    return c3 * x * x * x - c1 * x * x;
  },
  outBack: function (x) {
    return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2);
  },
  inOutBack: function (x) {
    return x < 0.5
      ? (pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
      : (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
  },
  inElastic: function (x) {
    return x === 0 ? 0 : x === 1 ? 1 : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4);
  },
  outElastic: function (x) {
    return x === 0 ? 0 : x === 1 ? 1 : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1;
  },
  inOutElastic: function (x) {
    return x === 0
      ? 0
      : x === 1
      ? 1
      : x < 0.5
      ? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2
      : (pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5)) / 2 + 1;
  },
  inBounce: function (x) {
    return 1 - bounceOut(1 - x);
  },
  outBounce: bounceOut,
  inOutBounce: function (x) {
    return x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2;
  },
};
