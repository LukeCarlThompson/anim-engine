/**
 * Creates a smooth clamp function that maps input toward a threshold
 * without ever exceeding it. Uses `x / (1 + |x|)` for a natural-feeling
 * curve — near-linear at low inputs, asymptotically approaches the
 * threshold at high inputs.
 *
 * Compared to a hard clamp, this gives a gradual rolloff that feels
 * more organic. Useful for capping velocity, torque, or force.
 *
 * @param threshold - The asymptotic maximum output (never exceeded).
 * @returns A function that applies smooth clamping to an input value.
 */
export const createSmoothClamp = (
  threshold: number,
): (input: number) => number => {
  return (input: number): number => {
    if (!isFinite(input)) {
      return input >= 0 ? threshold : -threshold;
    }
    const normalized = input / threshold;
    return threshold * (normalized / (1 + Math.abs(normalized)));
  };
};
