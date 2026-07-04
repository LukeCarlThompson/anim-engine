/**
 * Verlet integration step for spring physics.
 * Mutates `state` in place — zero allocation.
 */
export type SpringState = {
  current: number;
  velocity: number;
};

export const verletStep = (
  state: SpringState,
  target: number,
  stiffness: number,
  damping: number,
  mass: number,
  deltaMs: number,
): void => {
  const dt = deltaMs / 1000; // convert ms to seconds

  // Spring force: F = -k * (x - target)
  const force = -stiffness * (state.current - target);

  // Damping: Fd = -d * velocity
  const dampingForce = -damping * state.velocity;

  // Acceleration: a = F / m
  const acceleration = (force + dampingForce) / mass;

  // Verlet-style velocity update (semi-implicit Euler)
  state.velocity += acceleration * dt;
  state.current += state.velocity * dt;
};

/**
 * Check if the spring is near rest (within precision of target, velocity near 0).
 */
export const isNearRest = (
  current: number,
  velocity: number,
  target: number,
  precision: number,
): boolean => {
  return Math.abs(current - target) < precision && Math.abs(velocity) < precision;
};
