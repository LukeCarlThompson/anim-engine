import { easingFunctions } from "../easing/easing";
import type { Animation, DynamicValue, EaseFunction, EaseName } from "../shared/types";
import { getTicker } from "../ticker/get-ticker";
import { updateTween } from "./update";
import type { TweenState } from "./update";

const resolveEasing = (ease: EaseName | EaseFunction): EaseFunction =>
  typeof ease === "function" ? ease : easingFunctions[ease];

type ResolveFunction = (value: Animation) => void;

export type SingleTweenOptions = {
  from: DynamicValue;
  to: DynamicValue;
  durationMs: number;
  ease?: EaseName | EaseFunction;
  delayMs?: number;
  repeat?: number;
  yoyo?: boolean;
  onStarted?: () => void;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: () => void;
  onRepeat?: () => void;
};

export type Keyframe = {
  at: number;
  value: DynamicValue;
  ease?: EaseName | EaseFunction;
};

export type KeyframedAnimationOptions = {
  keyframes: Keyframe[];
  onUpdate?: (value: number, velocity: number) => void;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
};

export type AnimationOptions = SingleTweenOptions | KeyframedAnimationOptions;

const isKeyframeMode = (options: AnimationOptions): options is KeyframedAnimationOptions => {
  return "keyframes" in options && Array.isArray(options.keyframes);
};

export const createAnimation = (options: AnimationOptions): Animation => {
  if (isKeyframeMode(options)) {
    return createKeyframeAnimation(options);
  }
  return createSingleTween(options);
};

// ─── Single-tween mode (existing) ───

const createSingleTween = (options: SingleTweenOptions): Animation => {
  const easeName: EaseName | EaseFunction = options.ease ?? "inOutSine";
  const repeatCount = options.repeat ?? 0;
  const yoyoEnabled = options.yoyo ?? false;
  const delayMs = options.delayMs ?? 0;
  const { onStarted, onUpdate, onEnded, onRepeat, durationMs } = options;

  let rawFrom: number | (() => number) = options.from;
  let rawTo: number | (() => number) = options.to;

  const state: TweenState = { progress: 0, currentValue: 0, velocity: 0 };
  let status: "playing" | "paused" | "stopped" | "dead" = "stopped";
  let stopped = false;
  let resolvePromise: ResolveFunction | undefined;
  let repeatCounter = 0;
  let isReversed = false;
  let delayRemainingMs = 0;
  let pendingStart = false;

  const ticker = getTicker();

  const update = (deltaMs: number) => {
    if (stopped) return;
    if (pendingStart) {
      delayRemainingMs -= deltaMs;
      if (delayRemainingMs > 0) return;
      pendingStart = false;
      onStarted?.();
      deltaMs = -delayRemainingMs;
    }
    const from = typeof rawFrom === "function" ? rawFrom() : rawFrom;
    const to = typeof rawTo === "function" ? rawTo() : rawTo;
    const completed = updateTween(state, deltaMs, durationMs, currentEase, from, to);
    onUpdate?.(state.currentValue, state.velocity);
    if (completed) handleCompletion();
  };

  let currentEase: EaseFunction = resolveEasing(easeName);

  const play = (): Promise<Animation> => {
    if (status === "dead") throw new Error("Cannot play a dead animation");
    stopped = false;
    repeatCounter = 0;
    isReversed = false;
    state.progress = 0;
    const initFrom = typeof rawFrom === "function" ? rawFrom() : rawFrom;
    state.currentValue = initFrom;
    state.velocity = 0;

    if (delayMs > 0) {
      delayRemainingMs = delayMs;
      pendingStart = true;
    } else {
      pendingStart = false;
      delayRemainingMs = 0;
    }

    const promise = new Promise<Animation>((resolve) => {
      resolvePromise = resolve;
    });
    status = "playing";
    ticker.add(update);
    if (delayRemainingMs <= 0) onStarted?.();
    return promise;
  };

  const pause = () => {
    if (status !== "playing") return;
    status = "paused";
    ticker.remove(update);
  };

  const resume = () => {
    if (status !== "paused") return;
    status = "playing";
    ticker.add(update);
  };

  const stop = () => {
    stopped = true;
    status = "stopped";
    ticker.remove(update);
    resolvePromise?.(controls);
    resolvePromise = undefined;
  };

  const skipToEnd = () => {
    const skipTo = typeof rawTo === "function" ? rawTo() : rawTo;
    state.currentValue = skipTo;
    state.velocity = 0;
    state.progress = 1;
    onUpdate?.(state.currentValue, state.velocity);
    if (status === "playing" || status === "paused") {
      onEnded?.();
    }
    status = "stopped";
    ticker.remove(update);
    resolvePromise?.(controls);
    resolvePromise = undefined;
  };

  const kill = () => {
    status = "dead";
    ticker.remove(update);
    stopped = true;
    resolvePromise = undefined;
  };

  function handleCompletion() {
    onEnded?.();
    if (repeatCounter < repeatCount) {
      repeatCounter++;
      if (yoyoEnabled) isReversed = !isReversed;
      state.progress = 0;
      const revFrom = typeof rawFrom === "function" ? rawFrom() : rawFrom;
      const revTo = typeof rawTo === "function" ? rawTo() : rawTo;
      state.currentValue = isReversed ? revTo : revFrom;
      state.velocity = 0;
      onRepeat?.();
      return;
    }
    status = "stopped";
    ticker.remove(update);
    resolvePromise?.(controls);
    resolvePromise = undefined;
  }

  const controls: Animation = {
    play,
    pause,
    resume,
    stop,
    skipToEnd,
    kill,
    setCurrentValue: (value: number) => {
      state.currentValue = value;
      state.velocity = 0;
    },
    get currentValue() {
      return state.currentValue;
    },
    get velocity() {
      return state.velocity;
    },
    get progress() {
      return state.progress;
    },
    setProgress(value: number) {
      if (status === "playing") pause();
      const clamped = Math.max(0, Math.min(1, value));
      state.progress = clamped;
      const from = typeof rawFrom === "function" ? rawFrom() : rawFrom;
      const to = typeof rawTo === "function" ? rawTo() : rawTo;
      state.currentValue = from + (to - from) * currentEase(clamped);
      state.velocity = 0;
      onUpdate?.(state.currentValue, state.velocity);
    },
    get status() {
      return status;
    },
    get durationMs() {
      return durationMs;
    },
  };

  return controls;
};

// ─── Keyframe mode ───

const createKeyframeAnimation = (options: KeyframedAnimationOptions): Animation => {
  const keyframes = options.keyframes;
  const onUpdate = options.onUpdate;
  const onProgress = options.onProgress;
  const onEnded = options.onEnded;

  // Sort keyframes by time
  const sorted = [...keyframes].sort((a, b) => a.at - b.at);
  const totalDurationMs = sorted[sorted.length - 1].at;
  const invTotalDuration = 1 / totalDurationMs;

  // Resolve a keyframe's value (function or literal)
  const resolveKeyframeValue = (kf: Keyframe): number => {
    return typeof kf.value === "function" ? kf.value() : kf.value;
  };

  // Create segment from one keyframe to the next
  type Segment = { from: number; to: number; range: number; durationMs: number; easeFn: EaseFunction };
  const segments: Segment[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const from = resolveKeyframeValue(current);
    const to = resolveKeyframeValue(next);
    segments.push({
      from,
      to,
      range: to - from,
      durationMs: next.at - current.at,
      easeFn: resolveEasing(next.ease ?? "inOutSine"),
    });
  }

  // Pre-compute prefix sums for O(1) elapsed-time lookups
  const prefixSum: number[] = [0];
  for (let i = 0; i < segments.length; i++) {
    prefixSum.push(prefixSum[i] + segments[i].durationMs);
  }

  if (segments.length === 0) {
    // Single keyframe — just hold the value
    return createSingleTween({
      from: resolveKeyframeValue(sorted[0]),
      to: resolveKeyframeValue(sorted[0]),
      durationMs: totalDurationMs,
      ease: "linear",
      onUpdate,
      onEnded,
    });
  }

  // State
  const state: TweenState = { progress: 0, currentValue: 0, velocity: 0 };
  let status: "playing" | "paused" | "stopped" | "dead" = "stopped";
  let stopped = false;
  let resolvePromise: ResolveFunction | undefined;
  let currentSegmentIndex = 0;
  let previousValue = resolveKeyframeValue(sorted[0]);

  const ticker = getTicker();

  const update = (deltaMs: number) => {
    if (stopped) return;

    const segment = segments[currentSegmentIndex];
    segmentElapsed += deltaMs;

    // Advance segment progress
    segmentProgress += deltaMs / segment.durationMs;
    if (segmentProgress >= 1) {
      segmentProgress = 1;
    }

    // Compute eased value directly (don't use updateTween to avoid state.progress conflict)
    const eased = segment.easeFn(segmentProgress);
    previousValue = state.currentValue;
    state.currentValue = segment.from + segment.range * eased;

    if (segmentProgress >= 1) {
      state.currentValue = segment.to;
      state.velocity = 0;
    } else {
      state.velocity = (state.currentValue - previousValue) / (deltaMs / 1000);
    }

    // Compute global progress (O(1) via prefix sum)
    const elapsedTotal = prefixSum[currentSegmentIndex] + segmentElapsed;
    state.progress = Math.min(elapsedTotal * invTotalDuration, 1);
    onProgress?.(state.progress);

    onUpdate?.(state.currentValue, state.velocity);

    // Check if segment completed
    if (segmentProgress >= 1) {
      if (currentSegmentIndex < segments.length - 1) {
        currentSegmentIndex++;
        segmentElapsed = 0;
        segmentProgress = 0;
        state.currentValue = segments[currentSegmentIndex].from;
        previousValue = state.currentValue;
        state.velocity = 0;
        // Update global progress to end of previous segment (O(1) via prefix sum)
        state.progress = Math.min(prefixSum[currentSegmentIndex] * invTotalDuration, 1);
        onProgress?.(state.progress);
      } else {
        status = "stopped";
        ticker.remove(update);
        onEnded?.();
        resolvePromise?.(controls);
        resolvePromise = undefined;
      }
    }
  };

  // Separate segment progress tracker (state.progress is overridden with global progress)
  let segmentProgress = 0;
  let segmentElapsed = 0;

  const play = (): Promise<Animation> => {
    if (status === "dead") throw new Error("Cannot play a dead animation");
    stopped = false;
    currentSegmentIndex = 0;
    segmentElapsed = 0;
    segmentProgress = 0;
    state.progress = 0;
    state.currentValue = segments[0].from;
    previousValue = segments[0].from;
    state.velocity = 0;

    const promise = new Promise<Animation>((resolve) => {
      resolvePromise = resolve;
    });
    status = "playing";
    ticker.add(update);
    return promise;
  };

  const pause = () => {
    if (status !== "playing") return;
    status = "paused";
    ticker.remove(update);
  };

  const resume = () => {
    if (status !== "paused") return;
    status = "playing";
    ticker.add(update);
  };

  const stop = () => {
    stopped = true;
    status = "stopped";
    ticker.remove(update);
    resolvePromise?.(controls);
    resolvePromise = undefined;
  };

  const skipToEnd = () => {
    const last = segments[segments.length - 1];
    state.currentValue = last.to;
    state.velocity = 0;
    state.progress = 1;
    onUpdate?.(state.currentValue, state.velocity);
    if (status === "playing" || status === "paused") {
      onEnded?.();
    }
    status = "stopped";
    ticker.remove(update);
    resolvePromise?.(controls);
    resolvePromise = undefined;
  };

  const kill = () => {
    status = "dead";
    ticker.remove(update);
    stopped = true;
    resolvePromise = undefined;
  };

  const controls: Animation = {
    play,
    pause,
    resume,
    stop,
    skipToEnd,
    kill,
    setCurrentValue: (value: number) => {
      state.currentValue = value;
      state.velocity = 0;
    },
    get currentValue() {
      return state.currentValue;
    },
    get velocity() {
      return state.velocity;
    },
    get progress() {
      return state.progress;
    },
    setProgress(value: number) {
      if (status === "playing") pause();
      const clamped = Math.max(0, Math.min(1, value));
      state.progress = clamped;

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
      const eased = segment.easeFn(Math.max(0, Math.min(1, segProgress)));
      state.currentValue = segment.from + segment.range * eased;
      state.velocity = 0;
      onUpdate?.(state.currentValue, state.velocity);
      onProgress?.(clamped);
    },
    get status() {
      return status;
    },
    get durationMs() {
      return totalDurationMs;
    },
  };

  return controls;
};
