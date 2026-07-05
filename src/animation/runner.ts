import type { EaseFunction } from "../shared/types";
import { updateTween } from "./update";
import type { TweenState } from "./update";

// ─── Runner type ───

export type Runner = {
  /** Step the runner forward by deltaMs. Returns true if completed. */
  step: (deltaMs: number) => boolean;
  /** Jump to a specific local progress (0–1). Returns the value at that progress. */
  evaluate: (progress: number) => number;
  /** Reset to initial state (progress=0, value=first keyframe value). */
  reset: () => void;

  /** Read current state. */
  readonly currentValue: number;
  readonly velocity: number;
  readonly progress: number;

  /** Callbacks (set at creation, fire during step/evaluate). */
  readonly onStarted: (() => void) | undefined;
  readonly onUpdate: ((value: number, velocity: number) => void) | undefined;
  readonly onProgress: ((progress: number) => void) | undefined;
  readonly onEnded: (() => void) | undefined;
};

// ─── Tween runner ───

export type TweenRunnerConfig = {
  from: number;
  to: number;
  durationMs: number;
  easeFn: EaseFunction;
  onStarted?: () => void;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
};

export const createTweenRunner = (config: TweenRunnerConfig): Runner => {
  const { from, to, durationMs, easeFn, onStarted, onUpdate, onEnded } = config;
  const state: TweenState = { progress: 0, currentValue: from, velocity: 0 };

  const step = (deltaMs: number): boolean => {
    const completed = updateTween(state, deltaMs, durationMs, easeFn, from, to);
    onUpdate?.(state.currentValue, state.velocity);
    if (completed) onEnded?.();
    return completed;
  };

  const evaluate = (progress: number): number => {
    const clamped = Math.max(0, Math.min(1, progress));
    state.progress = clamped;
    if (clamped >= 1) {
      state.currentValue = to;
      state.velocity = 0;
    } else {
      const range = to - from;
      state.currentValue = from + range * easeFn(clamped);
      state.velocity = 0;
    }
    onUpdate?.(state.currentValue, state.velocity);
    return state.currentValue;
  };

  const reset = () => {
    state.progress = 0;
    state.currentValue = from;
    state.velocity = 0;
  };

  return {
    step,
    evaluate,
    reset,
    get currentValue() {
      return state.currentValue;
    },
    get velocity() {
      return state.velocity;
    },
    get progress() {
      return state.progress;
    },
    onStarted,
    onUpdate,
    onProgress: undefined,
    onEnded,
  };
};

// ─── Keyframe runner ───

type Segment = {
  from: number;
  to: number;
  range: number;
  durationMs: number;
  easeFn: EaseFunction;
};

export type KeyframeRunnerConfig = {
  keyframes: { value: number; gap: number; easeFn: EaseFunction }[];
  onStarted?: () => void;
  onUpdate?: (value: number, velocity: number) => void;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
};

export const createKeyframeRunner = (config: KeyframeRunnerConfig): Runner => {
  const { keyframes, onStarted, onUpdate, onProgress, onEnded } = config;

  // Build segments from consecutive keyframe pairs
  const segments: Segment[] = [];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const current = keyframes[i];
    const next = keyframes[i + 1];
    segments.push({
      from: current.value,
      to: next.value,
      range: next.value - current.value,
      durationMs: next.gap,
      easeFn: next.easeFn,
    });
  }

  // Pre-compute prefix sums for O(1) elapsed-time lookups
  const prefixSum: number[] = [0];
  for (let i = 0; i < segments.length; i++) {
    prefixSum.push(prefixSum[i] + segments[i].durationMs);
  }

  const totalDurationMs = prefixSum[prefixSum.length - 1];
  const invTotalDuration = totalDurationMs > 0 ? 1 / totalDurationMs : 0;

  // State
  let currentValue = keyframes[0].value;
  let velocity = 0;
  let globalProgress = 0;
  let currentSegmentIndex = 0;
  let segmentElapsed = 0;
  let segmentProgress = 0;

  const step = (deltaMs: number): boolean => {
    if (segments.length === 0) {
      onEnded?.();
      return true;
    }

    const segment = segments[currentSegmentIndex];
    segmentElapsed += deltaMs;

    // Advance segment progress
    if (segment.durationMs > 0) {
      segmentProgress += deltaMs / segment.durationMs;
    } else {
      segmentProgress = 1;
    }
    if (segmentProgress >= 1) {
      segmentProgress = 1;
    }

    // Compute eased value
    const previousValue = currentValue;
    if (segmentProgress >= 1) {
      currentValue = segment.to;
      velocity = 0;
    } else {
      const eased = segment.easeFn(segmentProgress);
      currentValue = segment.from + segment.range * eased;
      velocity = (currentValue - previousValue) / (deltaMs / 1000);
    }

    // Compute global progress
    const elapsedTotal = prefixSum[currentSegmentIndex] + segmentElapsed;
    globalProgress = totalDurationMs > 0 ? Math.min(elapsedTotal * invTotalDuration, 1) : 1;

    onUpdate?.(currentValue, velocity);

    // Check if segment completed
    if (segmentProgress >= 1) {
      if (currentSegmentIndex < segments.length - 1) {
        currentSegmentIndex++;
        segmentElapsed = 0;
        segmentProgress = 0;
        currentValue = segments[currentSegmentIndex].from;
        velocity = 0;
        globalProgress = totalDurationMs > 0 ? Math.min(prefixSum[currentSegmentIndex] * invTotalDuration, 1) : 1;
        onProgress?.(globalProgress);
      } else {
        onProgress?.(1);
        onEnded?.();
        return true;
      }
    }

    return false;
  };

  const evaluate = (progress: number): number => {
    const clamped = Math.max(0, Math.min(1, progress));

    if (segments.length === 0) {
      globalProgress = 1;
      currentValue = keyframes[0].value;
      velocity = 0;
      return currentValue;
    }

    const elapsed = clamped * totalDurationMs;

    // Find the right segment
    let segIdx = 0;
    for (let i = 0; i < segments.length; i++) {
      if (elapsed <= prefixSum[i + 1]) {
        segIdx = i;
        break;
      }
      segIdx = i;
    }

    const segment = segments[segIdx];
    const segStart = prefixSum[segIdx];
    const segDuration = segment.durationMs;
    const segProgress = segDuration > 0 ? (elapsed - segStart) / segDuration : 1;
    const clampedSegProgress = Math.max(0, Math.min(1, segProgress));

    const eased = segment.easeFn(clampedSegProgress);
    currentValue = segment.from + segment.range * eased;
    velocity = 0;
    globalProgress = clamped;

    currentSegmentIndex = segIdx;
    segmentElapsed = elapsed - segStart;
    segmentProgress = clampedSegProgress;

    onUpdate?.(currentValue, velocity);
    onProgress?.(clamped);
    return currentValue;
  };

  const reset = () => {
    currentValue = keyframes[0].value;
    velocity = 0;
    globalProgress = 0;
    currentSegmentIndex = 0;
    segmentElapsed = 0;
    segmentProgress = 0;
  };

  return {
    step,
    evaluate,
    reset,
    get currentValue() {
      return currentValue;
    },
    get velocity() {
      return velocity;
    },
    get progress() {
      return globalProgress;
    },
    onStarted,
    onUpdate,
    onProgress,
    onEnded,
  };
};
