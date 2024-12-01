import type { TweenSequence, TweenSequenceOptions, TweenTarget } from "./tween-machine";

import { TweenSequenceImplementation } from "./tween-implementation/tween-sequence";

export const createSequence = <Target extends TweenTarget>(
  target: Target,
  options: TweenSequenceOptions<Target>
): TweenSequence => {
  return new TweenSequenceImplementation({ target, ...options });
};
