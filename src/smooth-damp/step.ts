/**
 * Unity-style Smooth Damp step function.
 * Mutates `state` in place — zero allocation.
 */
export type SmoothDampState = {
  current: number;
  velocity: number;
};

/**
 * One frame of Smooth Damp using Unity's formula.
 * Frame-rate independent, critically damped approach toward target.
 */
export const smoothDampStep = (
  state: SmoothDampState,
  target: number,
  smoothTime: number,
  maxSpeed: number,
  deltaMs: number,
): void => {
  const deltaTime = deltaMs / 1000;
  const st = Math.max(0.0001, smoothTime);
  const omega = 2 / st;
  const x = omega * deltaTime;
  // Taylor series approximation of exp(-x)
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  const change = state.current - target;
  const originalTo = target;
  const maxChange = maxSpeed * st;
  const clampedChange = Math.max(-maxChange, Math.min(change, maxChange));

  target = state.current - clampedChange;
  const temp = (state.velocity + omega * clampedChange) * deltaTime;
  state.velocity = (state.velocity - omega * temp) * exp;

  state.current = target + (clampedChange + temp) * exp;

  // Prevent overshoot
  if ((originalTo - state.current > 0) === (state.current > originalTo)) {
    state.current = originalTo;
    state.velocity = (originalTo - state.current) / deltaTime;
  }
};
