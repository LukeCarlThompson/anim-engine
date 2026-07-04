import type { Interpolation, DynamicValue } from "../shared/types";

export type SmoothDampOptions = {
  from: () => number;
  to: () => number;
  smoothTime: DynamicValue<number>;
  maxSpeed?: DynamicValue<number>;
  onUpdate: (value: number, velocity: number) => void;
};
import { getTicker } from "../ticker/get-ticker";
import { smoothDampStep } from "./step";
import type { SmoothDampState } from "./step";

export const createSmoothDamp = (options: SmoothDampOptions): Interpolation<number> => {
  const onUpdate = options.onUpdate;

  const state: SmoothDampState = { current: 0, velocity: 0 };
  let active = true;

  const ticker = getTicker();

  const resolveValue = (v: number | (() => number)): number => (typeof v === "function" ? v() : v);

  // Initialize with starting position
  state.current = options.from();

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
    const smoothTime = resolveValue(options.smoothTime);
    const maxSpeed = options.maxSpeed !== undefined ? resolveValue(options.maxSpeed) : Infinity;
    smoothDampStep(state, target, smoothTime, maxSpeed, deltaMs);

    onUpdate(state.current, state.velocity);
  }

  const controls: Interpolation<number> = {
    start,
    stop,
    kill,
    setCurrent: (value: number) => {
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
