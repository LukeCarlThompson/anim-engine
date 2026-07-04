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

export type Status = "playing" | "paused" | "stopped" | "dead";

export type DynamicValue<T> = T | (() => T);

// === Animation ===

export type Animation<T> = {
  play: () => Promise<Animation<T>>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipToEnd: () => void;
  kill: () => void;

  setCurrent: (value: T) => void;

  currentValue: T;
  velocity: T;
  progress: number;
  status: Status;
  getDurationMs: () => number;
};

// === Interpolation ===

export type Interpolation<T> = {
  start: () => void;
  stop: () => void;
  kill: () => void;

  setCurrent: (value: T) => void;

  currentValue: T;
  velocity: T;
  status: "active" | "inactive" | "dead";
};
