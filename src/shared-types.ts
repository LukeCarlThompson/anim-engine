// === Shared Types ===

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
