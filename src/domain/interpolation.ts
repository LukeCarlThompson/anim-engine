import { DynamicValue } from "./resolve-value";

export type InterpolationStatus = "active" | "inactive" | "dead";

export type Interpolation = {
  start: () => void;
  stop: () => void;
  kill: () => void;

  setCurrentValue: (value: number) => void;

  currentValue: number;
  velocity: number;
  status: InterpolationStatus;
};

export type LerpOptions = {
  to: () => number;
  smoothTimeMs: DynamicValue;
  precision?: number;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
};

export type SmoothDampOptions = {
  to: () => number;
  smoothTimeMs: DynamicValue;
  maxSpeed?: DynamicValue;
  precision?: number;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
};

export type SpringOptions = {
  to: () => number;
  stiffness?: DynamicValue;
  damping?: DynamicValue;
  mass?: DynamicValue;
  precision?: number;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
};
