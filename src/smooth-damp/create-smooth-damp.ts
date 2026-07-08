import { resolveValue } from "../domain";
import type { Interpolation, SmoothDampOptions } from "../domain";
import { getTicker } from "../ticker";
import { smoothDampStep } from "./step";
import type { SmoothDampState } from "./step";

export const createSmoothDamp = ({
  to,
  smoothTimeMs: rawSmoothTimeMs,
  maxSpeed: rawMaxSpeed,
  precision = 0.01,
  onUpdate,
  onEnded,
  ticker = getTicker(),
}: SmoothDampOptions): Interpolation => {
  const state: SmoothDampState = { current: 0, velocity: 0 };
  let active = true;

  // Initialize at the target position
  state.current = to();

  const update = (deltaMs: number) => {
    if (!active) return;

    const target = to();
    const smoothTimeMs = resolveValue(rawSmoothTimeMs);
    const maxSpeed = rawMaxSpeed !== undefined ? resolveValue(rawMaxSpeed) : Infinity;
    smoothDampStep(state, target, smoothTimeMs, maxSpeed, deltaMs);

    onUpdate?.(state.current, state.velocity);

    if (
      onEnded &&
      Math.abs(state.current - target) < precision &&
      Math.abs(state.velocity) < precision
    ) {
      state.current = target;
      state.velocity = 0;
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
      state.velocity = 0;
    },
    get value() {
      return state.current;
    },
    get velocity() {
      return state.velocity;
    },
    get status() {
      return active ? "active" : "inactive";
    },
  };

  return controls;
};
