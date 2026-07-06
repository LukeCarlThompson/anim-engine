import { resolveValue } from "../domain";
import type { Interpolation, DynamicValue } from "../domain";

export type SmoothDampOptions = {
  to: () => number;
  smoothTimeMs: DynamicValue;
  maxSpeed?: DynamicValue;
  precision?: number;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
};
import { getTicker } from "../ticker";
import { smoothDampStep } from "./step";
import type { SmoothDampState } from "./step";

export const createSmoothDamp = (options: SmoothDampOptions): Interpolation => {
  const precision = options.precision ?? 0.01;
  const onUpdate = options.onUpdate;
  const onEnded = options.onEnded;

  const state: SmoothDampState = { current: 0, velocity: 0 };
  let active = true;

  const ticker = getTicker();

  // Initialize at the target position
  state.current = options.to();

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
    const maxSpeed = options.maxSpeed !== undefined ? resolveValue(options.maxSpeed) : Infinity;
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
  }

  const controls: Interpolation = {
    start,
    stop,
    kill,
    setCurrentValue: (value: number) => {
      state.current = value;
      state.velocity = 0;
    },
    get currentValue() {
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
