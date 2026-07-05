// === Shared Types ===

export type EaseName =
  | "linear"
  | "inQuad"
  | "outQuad"
  | "inOutQuad"
  | "inCubic"
  | "outCubic"
  | "inOutCubic"
  | "inQuart"
  | "outQuart"
  | "inOutQuart"
  | "inQuint"
  | "outQuint"
  | "inOutQuint"
  | "inSine"
  | "outSine"
  | "inOutSine"
  | "inExpo"
  | "outExpo"
  | "inOutExpo"
  | "inCirc"
  | "outCirc"
  | "inOutCirc"
  | "inBack"
  | "outBack"
  | "inOutBack"
  | "inElastic"
  | "outElastic"
  | "inOutElastic"
  | "inBounce"
  | "outBounce"
  | "inOutBounce";

export type EaseFunction = (t: number) => number;

export type AnimationStatus = "playing" | "paused" | "stopped" | "dead";

export type InterpolationStatus = "active" | "inactive" | "dead";

export type DynamicValue = number | (() => number);

// === Interpolation ===

export type Interpolation = {
  start: () => void;
  stop: () => void;
  kill: () => void;

  setCurrentValue: (value: number) => void;

  currentValue: number;
  velocity: number;
  status: InterpolationStatus;
};
