import type { TweenState } from "./tween-state";

/**
 * Update the tween state once per frame
 */
export const updateTweenState = (deltaMs: number, tweenState: TweenState): void => {
  const thisUpdateTimeProgressFraction = deltaMs / tweenState.durationMs;
  tweenState.progressFraction = Math.min(tweenState.progressFraction + thisUpdateTimeProgressFraction, 1);
};
