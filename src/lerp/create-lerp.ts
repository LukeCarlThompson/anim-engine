import { resolveValue } from "../domain";
import type { Interpolation, LerpOptions } from "../domain";
import { getTicker } from "../ticker/get-ticker";
import { lerpStep } from "./step";
import type { LerpState } from "./step";

export const createLerp = ({
  precision = 0.01,
  onUpdate,
  onEnded,
  to,
  smoothTimeMs: rawSmoothTimeMs,
  ticker = getTicker(),
}: LerpOptions): Interpolation => {
  const state: LerpState = { current: 0 };
  let previousValue = 0;
  let currentVelocity = 0;
  let active = true;

  // Initialize at the target position
  state.current = to();
  previousValue = state.current;

  const update = (deltaMs: number) => {
    if (!active) return;

    const target = to();
    const smoothTimeMs = resolveValue(rawSmoothTimeMs);
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

  const resume = () => {
    if (active) return;
    active = true;
    ticker.add(update);
  };

  const stop = () => {
    active = false;
    ticker.remove(update);
  };

  const controls: Interpolation = {
    resume,
    stop,
    setValue: (value: number) => {
      state.current = value;
      previousValue = value;
      currentVelocity = 0;
    },
    get value() {
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
