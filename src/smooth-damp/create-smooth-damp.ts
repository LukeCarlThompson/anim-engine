import type { SmoothDampOptions, ContinuousControls } from "../shared/types";
import { getTicker } from "../ticker/get-ticker";
import { smoothDampStep } from "./step";
import type { SmoothDampState } from "./step";

export const createSmoothDamp = (options: SmoothDampOptions): ContinuousControls<number> => {
  const onUpdate = options.onUpdate;

  const state: SmoothDampState = { current: 0, velocity: 0 };
  let active = true;

  const ticker = getTicker();
  const animationHandle = { update: onTickerUpdate };

  const resolveValue = (v: number | (() => number)): number =>
    typeof v === "function" ? (v as () => number)() : v;

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
    const smoothTime = resolveValue(options.smoothTime);
    const maxSpeed = options.maxSpeed !== undefined ? resolveValue(options.maxSpeed) : Infinity;
    smoothDampStep(state, target, smoothTime, maxSpeed, deltaMs);

    onUpdate(state.current, state.velocity);
  }

  const controls: ContinuousControls<number> = {
    start, stop, kill,
    setCurrent: (value: number) => { state.current = value; state.velocity = 0; },
    get currentValue() { return state.current; },
    get velocity() { return state.velocity; },
    get status() { return active ? "active" : "inactive"; },
  };

  return controls;
};
