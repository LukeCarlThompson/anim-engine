import type { EaseFunction } from "../shared/types";
import { updateTween } from "./update";
import type { TweenState } from "./update";

// ─── Runner type (callable) ───

export type Runner = {
  (deltaMs: number): boolean;
  evaluate: (progress: number) => number;
  reset: () => void;
  currentValue: number;
  velocity: number;
  progress: number;
  onStarted: (() => void) | undefined;
  onUpdate: ((value: number, velocity: number) => void) | undefined;
  onProgress: ((progress: number) => void) | undefined;
  onEnded: (() => void) | undefined;
};

const noOp = () => {};

// ─── Tween runner ───

export type TweenRunnerConfig = {
  from: number;
  to: number;
  durationMs: number;
  easeFn: EaseFunction;
  onStarted?: () => void;
  onUpdate?: (value: number, velocity: number) => void;
  onProgress?: (progress: number) => void;
  onEnded: () => void;
};

export const createTweenRunner = (config: TweenRunnerConfig): Runner => {
  const {
    from,
    to,
    durationMs,
    easeFn,
    onStarted,
    onUpdate = noOp,
    onProgress = noOp,
    onEnded,
  } = config;
  const state: TweenState = { progress: 0, currentValue: from, velocity: 0 };

  let runner!: Runner;

  const step = (deltaMs: number): boolean => {
    const completed = updateTween(state, deltaMs, durationMs, easeFn, from, to);
    onUpdate(state.currentValue, state.velocity);
    onProgress(state.progress);
    if (completed) {
      onEnded();
    }
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
    onUpdate(state.currentValue, state.velocity);
    return state.currentValue;
  };

  const reset = () => {
    state.progress = 0;
    state.currentValue = from;
    state.velocity = 0;
  };

  runner = step as Runner;
  runner.evaluate = evaluate;
  runner.reset = reset;
  Object.defineProperty(runner, "currentValue", {
    get: () => state.currentValue,
    configurable: true,
  });
  Object.defineProperty(runner, "velocity", { get: () => state.velocity, configurable: true });
  Object.defineProperty(runner, "progress", { get: () => state.progress, configurable: true });
  runner.onStarted = onStarted;
  runner.onUpdate = onUpdate;
  runner.onProgress = undefined;
  runner.onEnded = onEnded;

  return runner;
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

export const createKeyframeRunner = ({
  keyframes,
  onStarted,
  onUpdate = noOp,
  onProgress = noOp,
  onEnded,
}: KeyframeRunnerConfig): Runner => {
  if (keyframes.length < 2) {
    throw new Error("Keyframe animation must have at least 2 keyframes");
  }

  const segments: Segment[] = [];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const cur = keyframes[i];
    const nxt = keyframes[i + 1];
    segments.push({
      from: cur.value,
      to: nxt.value,
      range: nxt.value - cur.value,
      durationMs: nxt.gap,
      easeFn: nxt.easeFn,
    });
  }

  const prefixSum: number[] = [0];
  for (let i = 0; i < segments.length; i++) {
    prefixSum.push(prefixSum[i] + segments[i].durationMs);
  }

  const totalDurationMs = prefixSum[prefixSum.length - 1];
  const invTotalDuration = totalDurationMs > 0 ? 1 / totalDurationMs : 1;

  // Mutable state
  let currentValue = keyframes[0].value;
  let velocity = 0;
  let globalProgress = 0;
  let currentSegmentIndex = 0;
  let segmentElapsed = 0;
  let segmentProgress = 0;

  // Build runner first so update can sync properties to it
  let runner: Runner;

  const update = (deltaMs: number): boolean => {
    const segment = segments[currentSegmentIndex];
    segmentElapsed += deltaMs;

    segmentProgress += deltaMs / segment.durationMs;
    if (segmentProgress >= 1) segmentProgress = 1;

    const previousValue = currentValue;
    const eased = segment.easeFn(segmentProgress);
    currentValue = segment.from + segment.range * eased;

    if (segmentProgress >= 1) {
      currentValue = segment.to;
      velocity = 0;
    } else {
      velocity = (currentValue - previousValue) / (deltaMs / 1000);
    }

    const elapsedTotal = prefixSum[currentSegmentIndex] + segmentElapsed;
    globalProgress = Math.min(elapsedTotal * invTotalDuration, 1);
    onProgress(globalProgress);
    onUpdate(currentValue, velocity);

    if (segmentProgress >= 1) {
      if (currentSegmentIndex < segments.length - 1) {
        currentSegmentIndex++;
        segmentElapsed = 0;
        segmentProgress = 0;
        currentValue = segments[currentSegmentIndex].from;
        velocity = 0;
        globalProgress = Math.min(prefixSum[currentSegmentIndex] * invTotalDuration, 1);
        onProgress(globalProgress);
      } else {
        onEnded?.();
        return true;
      }
    }

    return false;
  };

  const evaluate = (progress: number): number => {
    const clamped = Math.max(0, Math.min(1, progress));
    const elapsed = clamped * totalDurationMs;

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

    onUpdate(currentValue, velocity);
    onProgress(clamped);
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

  runner = update as Runner;
  runner.evaluate = evaluate;
  runner.reset = reset;
  Object.defineProperty(runner, "currentValue", { get: () => currentValue, configurable: true });
  Object.defineProperty(runner, "velocity", { get: () => velocity, configurable: true });
  Object.defineProperty(runner, "progress", { get: () => globalProgress, configurable: true });
  runner.onStarted = onStarted;
  runner.onUpdate = onUpdate;
  runner.onProgress = onProgress;
  runner.onEnded = onEnded;

  return runner;
};
