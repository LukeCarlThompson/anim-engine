import type { DynamicValue } from "../domain";
import type { KeyframeAnimationOptions, AnimationStatus } from "./animation";

export type TimelineLayer =
  | { animation: KeyframeAnimationOptions; at: DynamicValue }
  | { animation: KeyframeAnimationOptions; gap: number };

export type TimelineCallbacks = {
  onStarted?: () => void;
  onUpdate?: (values: number[], velocities: number[]) => void;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
};

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
  values: number[];
  velocities: number[];
};
