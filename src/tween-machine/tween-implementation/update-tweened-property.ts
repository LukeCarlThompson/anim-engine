import type { TweenState } from "./tween-state";
import type { TweenedProperty } from "./tweened-property";

/**
 * Update each tweened property once each frame after the tween state has been updated
 */
export const updateTweenedProperty = <Key>(
  tweenState: Readonly<TweenState>,
  tweenedProperty: TweenedProperty<Key>
): void => {
  const previousValue = tweenedProperty.value;

  const easedProgressFraction = tweenState.easeFunction(tweenState.progressFraction);
  const distance = tweenedProperty.to - tweenedProperty.from;
  tweenedProperty.value = tweenedProperty.from + distance * easedProgressFraction;

  tweenedProperty.velocity = tweenState.progressFraction === 1 ? 0 : tweenedProperty.value - previousValue;
};
