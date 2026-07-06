import type { EaseFunction } from "../domain";

export type TweenState = {
  progress: number;
  value: number;
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

  const previousValue = state.value;

  if (state.progress >= 1) {
    state.value = to;
    state.velocity = 0;
    return true;
  }

  const eased = easeFn(state.progress);
  const range = to - from;
  state.value = from + range * eased;
  state.velocity = (state.value - previousValue) / (deltaMs / 1000);
  return false;
};
