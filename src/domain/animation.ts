import type { EaseFunction, EaseName } from "./easing";
import { DynamicValue } from "./resolve-value";
import { ExternalTicker } from "./ticker";

export type AnimationStatus = "playing" | "paused" | "stopped";

export type SingleTweenOptions = {
  from: DynamicValue;
  to: DynamicValue;
  durationMs: DynamicValue;
  ease?: EaseName | EaseFunction;
  onStarted?: () => void;
  onUpdate?: (value: number, velocity: number) => void;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
  ticker?: ExternalTicker;
};

export type Keyframe = {
  value: DynamicValue;
  ease?: EaseName | EaseFunction;
  gap?: DynamicValue;
};

export type KeyframeAnimationOptions = {
  keyframes: Keyframe[];
  onStarted?: () => void;
  onUpdate?: (value: number, velocity: number) => void;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
  ticker?: ExternalTicker;
};

export type AnimationOptions = SingleTweenOptions | KeyframeAnimationOptions;

export type Animation = {
  play: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipToEnd: () => void;

  value: number;
  velocity: number;
  progress: number;
  setProgress: (value: number) => void;
  status: AnimationStatus;
  durationMs: number;
};
