import { getTicker, resolveValue } from "../domain";
import type { Interpolation, DynamicValue } from "../domain";
import { lerpStep } from "./step";
import type { LerpState } from "./step";

export type LerpOptions = {
  to: () => number;
  smoothTimeMs: DynamicValue;
  precision?: number;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
};

export const createLerp = (options: LerpOptions): Interpolation => {
  const precision = options.precision ?? 0.01;
  const onUpdate = options.onUpdate;
  const onEnded = options.onEnded;

  const state: LerpState = { current: 0 };
  let previousValue = 0;
  let currentVelocity = 0;
  let active = true;

  const ticker = getTicker();

  // Initialize at the target position
  state.current = options.to();
  previousValue = state.current;

  const update = (deltaMs: number) => {
    if (!active) return;

    const target = options.to();
    const smoothTimeMs = resolveValue(options.smoothTimeMs);
    lerpStep(state, target, smoothTimeMs, deltaMs);

    currentVelocity = (state.current - previousValue) / (deltaMs / 1000);
    previousValue = state.current;

    onUpdate?.(state.current, currentVelocity);

    if (
      onEnded &&
      Math.abs(state.current - target) < precision &&
      Math.abs(currentVelocity) < precision
    ) {
      state.current = target;
      currentVelocity = 0;
      onEnded();
    }
  };

  // Register immediately (auto-start)
  ticker.add(update);

  const start = () => {
    if (active) return;
    active = true;
    ticker.add(update);
  };

  const stop = () => {
    active = false;
    ticker.remove(update);
  };

  const kill = () => {
    active = false;
    ticker.remove(update);
  };

  const controls: Interpolation = {
    start,
    stop,
    kill,
    setCurrentValue: (value: number) => {
      state.current = value;
      previousValue = value;
      currentVelocity = 0;
    },
    get currentValue() {
      return state.current;
    },
    get velocity() {
      return currentVelocity;
    },
    get status() {
      return active ? "active" : "inactive";
    },
  };

  return controls;
};
