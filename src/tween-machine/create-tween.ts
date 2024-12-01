import type { PickByType, Tween, TweenOptions, TweenTarget } from "./tween-machine";

import { TweenImplementation } from "./tween-implementation";

export const createTween = <Target extends PickByType<TweenTarget, number>>(
  target: Target,
  { durationMs, ease, onEnded, onStarted, onUpdate, to }: TweenOptions<Target>
): Tween => {
  const controller = new TweenImplementation<Target>({
    target,
    to,
    durationMs,
    ease,
    onEnded,
    onStarted,
    onUpdate,
  });

  return controller;
};
