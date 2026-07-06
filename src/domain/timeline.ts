import type { DynamicValue } from "../domain";
import type { KeyframeAnimationOptions, AnimationStatus } from "./animation";

export type TimelineLayer =
  | { animation: KeyframeAnimationOptions; at: DynamicValue }
  | { animation: KeyframeAnimationOptions; gap: number };

export type Timeline = {
  play: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipToEnd: () => void;
  kill: () => void;
  setProgress: (value: number) => void;
  progress: number;
  status: AnimationStatus;
  durationMs: number;
};
