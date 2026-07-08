import { DynamicValue } from "./resolve-value";
import type { ExternalTicker } from "./ticker";

/**
 * Represents the status of an interpolation, which can be either "active" or "inactive".
 */
export type InterpolationStatus = "active" | "inactive";

/**
 * Represents an interpolation process that can be controlled and monitored.
 *
 * The interpolation can be resumed or stopped, and its current value, velocity, and status can be accessed.
 */
export type Interpolation = {
  /**
   * Resumes the interpolation if it is currently inactive.
   */
  resume: () => void;
  /**
   * Stops the interpolation if it is currently active.
   */
  stop: () => void;
  /**
   * Sets the current value of the interpolation instantly and resets its velocity to zero.
   */
  setValue: (value: number) => void;
  /**
   * The current value of the interpolation.
   */
  value: number;
  /**
   * The current velocity of the interpolation.
   */
  velocity: number;
  /**
   * The current status of the interpolation, which can be "active" or "inactive".
   */
  status: InterpolationStatus;
};

/**
 * Options for configuring a linear interpolation (lerp) function.
 */
export type LerpOptions = {
  /**
   * A function that returns the starting value for the interpolation. This is evaluated every frame.
   */
  to: () => number;
  /**
   * A function that returns the ending value for the interpolation. This is evaluated every frame if a function is provided.
   */
  smoothTimeMs: DynamicValue;
  /**
   * The precision threshold for determining when the interpolation has effectively reached its target. Defaults to 0.01.
   */
  precision?: number;
  /**
   * A callback function that is called on every update of the interpolation, receiving the current value and velocity as arguments.
   */
  onUpdate?: (value: number, velocity: number) => void;
  /**
   * A callback function that is called when the interpolation has effectively reached its target and is considered complete.
   */
  onEnded?: () => void;
  /**
   * An optional external ticker that can be provided to control the timing of the interpolation updates. If not provided, a default ticker will be used.
   */
  ticker?: ExternalTicker;
};

/**
 * Options for configuring a smooth damped interpolation.
 *
 * Smooth damp progressively moves toward a target value with velocity that
 * decreases as it approaches, producing a natural deceleration effect.
 */
export type SmoothDampOptions = {
  /**
   * A function that returns the target value to smoothly move toward.
   * This is evaluated every frame, allowing the target to change dynamically.
   */
  to: () => number;
  /**
   * The approximate time (in milliseconds) it takes for the value to settle
   * at the target. Larger values produce slower, more gradual movement.
   */
  smoothTimeMs: DynamicValue;
  /**
   * An optional maximum speed cap (in units/second). Prevents excessively
   * fast movement when the gap between current and target is large.
   */
  maxSpeed?: DynamicValue;
  /**
   * The precision threshold for determining when the interpolation has
   * effectively reached its target. Defaults to 0.01.
   */
  precision?: number;
  /**
   * A callback function that is called on every update of the interpolation,
   * receiving the current value and velocity as arguments.
   */
  onUpdate?: (value: number, velocity: number) => void;
  /**
   * A callback function that is called when the interpolation has effectively
   * reached its target and is considered complete.
   */
  onEnded?: () => void;
  /**
   * An optional external ticker that can be provided to control the timing of
   * the interpolation updates. If not provided, a default ticker will be used.
   */
  ticker?: ExternalTicker;
};

/**
 * Options for configuring a spring-based interpolation.
 *
 * Spring physics simulate mass-spring-damper motion, producing bouncy or
 * elastic movement toward the target value.
 */
export type SpringOptions = {
  /**
   * A function that returns the target value toward which the spring pulls.
   * This is evaluated every frame, allowing the target to change dynamically.
   */
  to: () => number;
  /**
   * The stiffness of the spring. Higher values produce faster, snappier motion.
   * Defaults to 180.
   */
  stiffness?: DynamicValue;
  /**
   * The damping coefficient. Higher values reduce oscillation and settling time.
   * Defaults to 12.
   */
  damping?: DynamicValue;
  /**
   * The mass of the simulated object. Higher values produce slower, heavier
   * motion. Defaults to 1.
   */
  mass?: DynamicValue;
  /**
   * The precision threshold for determining when the spring has effectively
   * settled at its target (both position and velocity within tolerance).
   * Defaults to 0.01.
   */
  precision?: number;
  /**
   * A callback function that is called on every update of the spring,
   * receiving the current value and velocity as arguments.
   */
  onUpdate?: (value: number, velocity: number) => void;
  /**
   * A callback function that is called when the spring has effectively
   * settled at its target and is considered complete.
   */
  onEnded?: () => void;
  /**
   * An optional external ticker that can be provided to control the timing of
   * the spring updates. If not provided, a default ticker will be used.
   */
  ticker?: ExternalTicker;
};
