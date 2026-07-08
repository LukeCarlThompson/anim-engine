import { DynamicValue } from "./resolve-value";
import type { ExternalTicker } from "./ticker";

export type InterpolationStatus = "active" | "inactive";

export type Interpolation = {
  resume: () => void;
  stop: () => void;

  setValue: (value: number) => void;

  value: number;
  velocity: number;
  status: InterpolationStatus;
};

export type LerpOptions = {
  to: () => number;
  smoothTimeMs: DynamicValue;
  precision?: number;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
  ticker?: ExternalTicker;
};

export type SmoothDampOptions = {
  to: () => number;
  smoothTimeMs: DynamicValue;
  maxSpeed?: DynamicValue;
  precision?: number;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
  ticker?: ExternalTicker;
};

export type SpringOptions = {
  to: () => number;
  stiffness?: DynamicValue;
  damping?: DynamicValue;
  mass?: DynamicValue;
  precision?: number;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
  ticker?: ExternalTicker;
};
