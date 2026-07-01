import type { SpringOptions, ContinuousControls } from "../shared/types";
import { getTicker } from "../ticker/get-ticker";
import { verletStep } from "./verlet";
import type { SpringState } from "./verlet";

export const createSpring = (options: SpringOptions): ContinuousControls<number> & { stiffness: number; damping: number; mass: number } => {
  let stiffness = options.stiffness ?? 100;
  let damping = options.damping ?? 10;
  let mass = options.mass ?? 1;
  const precision = options.precision ?? 0.01;
  const onUpdate = options.onUpdate;

  const rawFrom: number | (() => number) = options.from ?? 0;
  const rawTo: number | (() => number) = options.to;

  const state: SpringState = { current: 0, velocity: 0 };
  let active = true;

  const ticker = getTicker();
  const animationHandle = { update: onTickerUpdate };

  // Initialize
  const initFrom = typeof rawFrom === "function" ? (rawFrom as () => number)() : rawFrom;
  state.current = initFrom;

  // Register immediately (auto-start)
  ticker.add(animationHandle);

  const resolveTo = (): number => {
    return typeof rawTo === "function" ? (rawTo as () => number)() : rawTo;
  };

  const start = () => {
    if (active) return;
    active = true;
    ticker.add(animationHandle);
  };

  const stop = () => {
    active = false;
    ticker.remove(animationHandle);
  };

  const kill = () => {
    active = false;
    ticker.remove(animationHandle);
  };

  function onTickerUpdate(deltaMs: number) {
    if (!active) return;

    const target = resolveTo();
    verletStep(state, target, stiffness, damping, mass, deltaMs);

    onUpdate?.(state.current, state.velocity);

    // Auto-stop when near rest (only for static targets)
    const isStatic = typeof rawTo !== "function";
    if (isStatic && Math.abs(state.current - target) < precision && Math.abs(state.velocity) < precision) {
      state.current = target;
      state.velocity = 0;
      stop();
    }
  }

  const controls: ContinuousControls<number> & { stiffness: number; damping: number; mass: number } = {
    start, stop, kill,
    setCurrent: (value: number) => { state.current = value; state.velocity = 0; },
    get currentValue() { return state.current; },
    get velocity() { return state.velocity; },
    get status() { return active ? "active" : "inactive"; },
    get stiffness() { return stiffness; },
    set stiffness(v: number) { stiffness = v; },
    get damping() { return damping; },
    set damping(v: number) { damping = v; },
    get mass() { return mass; },
    set mass(v: number) { mass = v; },
  };

  return controls;
};
