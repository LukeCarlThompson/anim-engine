import type { KeyframeAnimationOptions, AnimationStatus } from "./animation";
import type { DynamicValue } from "./resolve-value";
import type { ExternalTicker } from "./ticker";

/**
 * A single layer in a timeline, describing when an animation plays.
 * - `at`: The animation starts at this absolute point in time (in ms).
 * - `gap`: The animation starts this many ms after the previous layer ends.
 */
export type TimelineLayer =
  | { animation: KeyframeAnimationOptions; at: DynamicValue }
  | { animation: KeyframeAnimationOptions; gap: number };

/**
 * Callback hooks and options for a timeline animation.
 */
export type TimelineCallbacks = {
  /** Callback fired when the timeline starts playing. */
  onStarted?: () => void;
  /**
   * Callback fired on each update with the current values and velocities
   * of all layers in the timeline.
   */
  onUpdate?: (values: number[], velocities: number[]) => void;
  /** Callback fired on each update with the current progress (0 to 1). */
  onProgress?: (progress: number) => void;
  /** Callback fired when the timeline ends. */
  onEnded?: () => void;
  /** Optional external ticker to drive the timeline. */
  ticker?: ExternalTicker;
};

/**
 * Represents a timeline animation instance that sequences multiple layers
 * and can be controlled and queried for its aggregate state.
 */
export type Timeline = {
  /** Plays the timeline from the current state. Returns a promise that resolves when the timeline ends. */
  play: () => Promise<void>;
  /** Pauses the timeline if it is currently playing. */
  pause: () => void;
  /** Resumes the timeline if it is currently paused. */
  resume: () => void;
  /** Stops the timeline and resets its state. */
  stop: () => void;
  /** Skips the timeline to its end state immediately. */
  skipToEnd: () => void;
  /** Sets the progress of the timeline to a specific value between 0 and 1. If playing, pauses. */
  setProgress: (value: number) => void;
  /** The current progress of the timeline (0 to 1). */
  progress: number;
  /**
   * The current status of the timeline, which can be "playing", "paused", or "stopped".
   * - "playing": The timeline is currently running.
   * - "paused": The timeline is temporarily halted but can be resumed.
   * - "stopped": The timeline has finished or has been stopped.
   */
  status: AnimationStatus;
  /** The total duration of the timeline in milliseconds. */
  durationMs: number;
  /** The current values of all layers in the timeline. */
  values: number[];
  /** The current velocities of all layers in the timeline. */
  velocities: number[];
};
