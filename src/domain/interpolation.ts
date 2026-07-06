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
