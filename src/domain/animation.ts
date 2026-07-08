import type { EaseFunction, EaseName } from "./easing";
import { DynamicValue } from "./resolve-value";
import { ExternalTicker } from "./ticker";

/**
 * The status of an animation, which can be "playing", "paused", or "stopped".
 * - "playing": The animation is currently running.
 * - "paused": The animation is temporarily halted but can be resumed.
 * - "stopped": The animation has finished or has been stopped and is available for garbage collection if no external references remain.
 */
export type AnimationStatus = "playing" | "paused" | "stopped";

/**
 * Options for creating a single tween animation, which interpolates between a starting and ending value over a specified duration with optional easing.
 */
export type SingleTweenOptions = {
  /**
   * The starting value of the animation. Can be a number or a function that returns a number.
   */
  from: DynamicValue;
  /**
   * The ending value of the animation. Can be a number or a function that returns a number.
   */
  to: DynamicValue;
  /**
   * The duration of the animation in milliseconds. Can be a number or a function that returns a number.
   */
  durationMs: DynamicValue;
  /**
   * The easing function or name to use for the animation.
   */
  ease?: EaseName | EaseFunction;
  /**
   * Callback fired when the animation starts.
   */
  onStarted?: () => void;
  /**
   * Callback fired on each animation update with the current value and velocity.
   */
  onUpdate?: (value: number, velocity: number) => void;
  /**
   * Callback fired on each animation update with the current progress (0 to 1).
   */
  onProgress?: (progress: number) => void;
  /**
   * Callback fired when the animation ends.
   */
  onEnded?: () => void;
  /**
   * Optional external ticker to drive the animation.
   */
  ticker?: ExternalTicker;
};

/**
 * Object for describing a single keyframe.
 */
export type Keyframe = {
  /**
   * The value of the keyframe. Can be a number or a function that returns a number.
   */
  value: DynamicValue;
  /**
   * The easing function or name to use for the keyframe.
   */
  ease?: EaseName | EaseFunction;
  /**
   * The gap before the keyframe in milliseconds. Can be a number or a function that returns a number.
   */
  gap?: DynamicValue;
};

/**
 * Options for creating a keyframe animation, which consists of multiple keyframes each with their own value, easing, and optional gap.
 */
export type KeyframeAnimationOptions = {
  /**
   * The keyframes for the animation. Each keyframe defines a value, optional easing, and optional gap in milliseconds.
   */
  keyframes: Keyframe[];
  /**
   * Callback fired when the animation starts.
   */
  onStarted?: () => void;
  /**
   * Callback fired on each animation update with the current value and velocity.
   */
  onUpdate?: (value: number, velocity: number) => void;
  /**
   * Callback fired on each animation update with the current progress (0 to 1).
   */
  onProgress?: (progress: number) => void;
  /**
   * Callback fired when the animation ends.
   */
  onEnded?: () => void;
  /**
   * Optional external ticker to drive the animation.
   */
  ticker?: ExternalTicker;
};

/**
 * Options for creating an animation, which can be either a single tween or a keyframe animation type.
 */
export type AnimationOptions = SingleTweenOptions | KeyframeAnimationOptions;

/**
 * Represents an animation instance that can be controlled and queried for its state.
 */
export type Animation = {
  /**
   * Plays the animation from the current state and returns a promise that resolves when the animation ends.
   */
  play: () => Promise<void>;
  /**
   * Pauses the animation if it is currently playing.
   */
  pause: () => void;
  /**
   * Resumes the animation if it is currently paused.
   */
  resume: () => void;
  /**
   * Stops the animation and resets its state.
   */
  stop: () => void;
  /**
   * Skips the animation to its end state immediately.
   */
  skipToEnd: () => void;

  /**
   * The current value of the animation.
   */
  value: number;
  /**
   * The current velocity of the animation.
   */
  velocity: number;
  /**
   * The current progress of the animation, represented as a number between 0 and 1.
   */
  progress: number;
  /**
   * Sets the progress of the animation to a specific value between 0 and 1. If the animation is playing, it will be paused.
   */
  setProgress: (value: number) => void;
  /**
   * The current status of the animation, which can be "playing", "paused", or "stopped".
   * - "playing": The animation is currently running.
   * - "paused": The animation is temporarily halted but can be resumed.
   * - "stopped": The animation has finished or has been stopped and is available for garbage collection if no external references remain.
   */
  status: AnimationStatus;
  /**
   * The total duration of the animation in milliseconds. This value is determined by the animation's configuration and keyframes.
   * For single tween animations, this is the specified duration. For keyframe animations, this is the sum of all keyframe gaps and durations.
   * Note that if the animation has dynamic values for duration or gaps, this value may change when the animation is played and the dynamic values are read.
   */
  durationMs: number;
};
