import type { Interpolation, DynamicValue } from "../shared-types";
export type SpringOptions = {
  to: () => number;
  stiffness?: DynamicValue;
  damping?: DynamicValue;
  mass?: DynamicValue;
  precision?: number;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
};
import { resolveValue } from "../resolve-value";
import { getTicker } from "../ticker/get-ticker";
import { verletStep } from "./verlet";
import type { SpringState } from "./verlet";

export const createSpring = (options: SpringOptions): Interpolation => {
  const precision = options.precision ?? 0.01;
  const onUpdate = options.onUpdate;
  const onEnded = options.onEnded;

  const rawTo = options.to;
  const rawStiffness: number | (() => number) = options.stiffness ?? 180;
  const rawDamping: number | (() => number) = options.damping ?? 12;
  const rawMass: number | (() => number) = options.mass ?? 1;

  const state: SpringState = { current: rawTo(), velocity: 0 };
  let active = true;

  const ticker = getTicker();

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

    const target = rawTo();
    const stiffness = resolveValue(rawStiffness);
    const damping = resolveValue(rawDamping);
    const mass = resolveValue(rawMass);
    verletStep(state, target, stiffness, damping, mass, deltaMs);

    onUpdate?.(state.current, state.velocity);

    // Fire onEnded when settled, but keep spring alive for target changes
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
