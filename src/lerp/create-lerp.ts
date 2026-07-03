import type { ContinuousControls, DynamicValue } from "../shared/types";

export type LerpOptions = {
  from: () => number;
  to: () => number;
  rate: DynamicValue<number>;
  onUpdate: (value: number) => void;
};
import { getTicker } from "../ticker/get-ticker";
import { lerpStep } from "./step";
import type { LerpState } from "./step";

export const createLerp = (options: LerpOptions): ContinuousControls<number> => {
  const onUpdate = options.onUpdate;

  const state: LerpState = { current: 0 };
  let active = true;

  const ticker = getTicker();
  const animationHandle = { update: onTickerUpdate };

  const resolveValue = (v: number | (() => number)): number => (typeof v === "function" ? v() : v);

  // Initialize with starting position
  state.current = options.from();

  // Register immediately (auto-start)
  ticker.add(animationHandle);

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

    const target = options.to();
    const rate = resolveValue(options.rate);
    lerpStep(state, target, rate, deltaMs);

    onUpdate(state.current);
  }

  const controls: ContinuousControls<number> = {
    start,
    stop,
    kill,
    setCurrent: (value: number) => {
      state.current = value;
    },
    get currentValue() {
      return state.current;
    },
    get velocity() {
      return 0;
    }, // Lerp has no velocity tracking
    get status() {
      return active ? "active" : "inactive";
    },
  };

  return controls;
};
