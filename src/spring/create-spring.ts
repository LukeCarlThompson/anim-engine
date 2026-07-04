import type { Interpolation, DynamicValue } from "../shared/types";
export type SpringOptions = {
  to: () => number;
  stiffness?: DynamicValue<number>;
  damping?: DynamicValue<number>;
  mass?: DynamicValue<number>;
  precision?: number;
  onStarted?: () => void;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
};
import { getTicker } from "../ticker/get-ticker";
import { verletStep } from "./verlet";
import type { SpringState } from "./verlet";

export const createSpring = (options: SpringOptions): Interpolation => {
  const onUpdate = options.onUpdate;

  const resolveValue = (v: number | (() => number)): number => (typeof v === "function" ? v() : v);

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
