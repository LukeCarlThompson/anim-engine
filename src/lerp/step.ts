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
 * where rate = 3 / (smoothTimeMs / 1000) ≈ reaches 95% in smoothTimeMs
 */
export const lerpStep = (
  state: LerpState,
  target: number,
  smoothTimeMs: number,
  deltaMs: number,
): void => {
  const deltaTime = deltaMs / 1000;
  const st = Math.max(0.0001, smoothTimeMs / 1000);
  const rate = 3 / st;
  state.current += (target - state.current) * rate * deltaTime;
};
