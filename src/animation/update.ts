import type { EaseFunction } from "../shared/types";

export type TweenState = {
  progress: number;
  currentValue: number;
  velocity: number;
};

/**
 * Advance a tween by one frame.
 * Mutates `state` in place — zero allocation.
 * Returns `true` if the tween has completed (progress >= 1).
 */
export const updateTween = (
  state: TweenState,
  deltaMs: number,
  durationMs: number,
  easeFn: EaseFunction,
  from: number,
  to: number,
): boolean => {
  const thisFrameProgress = deltaMs / durationMs;
  state.progress = Math.min(state.progress + thisFrameProgress, 1);

  const previousValue = state.currentValue;

  if (state.progress >= 1) {
    state.currentValue = to;
    state.velocity = 0;
    return true;
  }

  const eased = easeFn(state.progress);
  const range = to - from;
  state.currentValue = from + range * eased;
  state.velocity = (state.currentValue - previousValue) / (deltaMs / 1000);
  return false;
};
