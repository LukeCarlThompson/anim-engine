/**
 * Lerp step function — first-order exponential approach.
 * Mutates `state` in place — zero allocation.
 */
export type LerpState = {
  current: number;
};

/**
 * One frame of lerp approach.
 * Frame-rate independent. Approaches target asymptotically:
 *   current += (target - current) * rate * deltaTime
 */
export const lerpStep = (state: LerpState, target: number, rate: number, deltaMs: number): void => {
  const deltaTime = deltaMs / 1000;
  state.current += (target - state.current) * rate * deltaTime;
};
