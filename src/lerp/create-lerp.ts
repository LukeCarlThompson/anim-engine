import type { Interpolation, DynamicValue } from "../shared/types";
import { getTicker } from "../ticker/get-ticker";
import { lerpStep } from "./step";
import type { LerpState } from "./step";

export type LerpOptions = {
  to: () => number;
  smoothTimeMs: DynamicValue<number>;
  onUpdate?: (value: number, velocity: number) => void;
};

export const createLerp = (options: LerpOptions): Interpolation => {
  const onUpdate = options.onUpdate;

  const state: LerpState = { current: 0 };
  let previousValue = 0;
  let currentVelocity = 0;
  let active = true;

  const ticker = getTicker();

  const resolveValue = (v: number | (() => number)): number => (typeof v === "function" ? v() : v);

  // Initialize at the target position
  state.current = options.to();
  previousValue = state.current;

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

  function update(deltaMs: number) {
    if (!active) return;

    const target = options.to();
    const smoothTimeMs = resolveValue(options.smoothTimeMs);
    lerpStep(state, target, smoothTimeMs, deltaMs);

    currentVelocity = (state.current - previousValue) / (deltaMs / 1000);
    previousValue = state.current;

    onUpdate?.(state.current, currentVelocity);
  }

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
