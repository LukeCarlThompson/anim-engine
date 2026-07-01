import type { AnimControls, AnimateOptions, SingleTweenOptions, Keyframe } from "../shared/types";
import type { EaseFunction, EaseName } from "../shared/types";
import { getTicker } from "../ticker/get-ticker";
import { resolveEasing } from "../easing/easing";
import { updateTween } from "./update";
import type { TweenState } from "./update";

type ResolveFunction = (value: AnimControls<number>) => void;

const isKeyframeMode = (options: AnimateOptions): options is SingleTweenOptions & { keyframes: Keyframe[] } => {
  return "keyframes" in options && Array.isArray((options as { keyframes: unknown }).keyframes);
};

export const animate = (options: AnimateOptions): AnimControls<number> => {
  if (isKeyframeMode(options)) {
    return createKeyframeAnimation(options);
  }
  return createSingleTween(options as SingleTweenOptions);
};

// ─── Single-tween mode (existing) ───

const createSingleTween = (options: SingleTweenOptions): AnimControls<number> => {
  const durationMs = options.durationMs ?? 1000;
  const easeName: EaseName | EaseFunction = options.ease ?? "inOutSine";
  const repeatCount = options.repeat ?? 0;
  const yoyoEnabled = options.yoyo ?? false;
  const delayMs = options.delayMs ?? 0;
  const onStarted = options.onStarted;
  const onUpdate = options.onUpdate;
  const onEnded = options.onEnded;
  const onRepeat = options.onRepeat;

  let rawFrom: number | (() => number) = options.from ?? 0;
  let rawTo: number | (() => number) = options.to;

  const state: TweenState = { progress: 0, currentValue: 0, velocity: 0 };
  let status: "playing" | "paused" | "stopped" | "dead" = "stopped";
  let stopped = false;
  let resolvePromise: ResolveFunction | null = null;
  let repeatCounter = 0;
  let isReversed = false;
  let delayRemainingMs = 0;
  let pendingStart = false;

  const ticker = getTicker();
  const animationHandle = { update: onTickerUpdate };

  const resolveValues = () => {
    const from = typeof rawFrom === "function" ? (rawFrom as () => number)() : rawFrom;
    const to = typeof rawTo === "function" ? (rawTo as () => number)() : rawTo;
    return { from, to };
  };

  let currentEase: EaseFunction = resolveEasing(easeName);

  const play = (): Promise<AnimControls<number>> => {
    if (status === "dead") throw new Error("Cannot play a dead animation");
    stopped = false;
    repeatCounter = 0;
    isReversed = false;
    state.progress = 0;
    const { from } = resolveValues();
    state.currentValue = from;
    state.velocity = 0;

    if (delayMs > 0) {
      delayRemainingMs = delayMs;
      pendingStart = true;
    } else {
      pendingStart = false;
      delayRemainingMs = 0;
    }

    const promise = new Promise<AnimControls<number>>((resolve) => { resolvePromise = resolve; });
    status = "playing";
    ticker.add(animationHandle);
    if (delayRemainingMs <= 0) onStarted?.(state.currentValue);
    return promise;
  };

  const pause = () => {
    if (status !== "playing") return;
    status = "paused";
    ticker.remove(animationHandle);
  };

  const resume = () => {
    if (status !== "paused") return;
    status = "playing";
    ticker.add(animationHandle);
  };

  const stop = () => {
    stopped = true;
    status = "stopped";
    ticker.remove(animationHandle);
    resolvePromise?.(controls);
    resolvePromise = null;
  };

  const skipToEnd = () => {
    const { to } = resolveValues();
    state.currentValue = to;
    state.velocity = 0;
    state.progress = 1;
    if (status === "playing" || status === "paused") {
      onUpdate?.(state.currentValue, state.velocity);
      onEnded?.(state.currentValue);
    }
    status = "stopped";
    ticker.remove(animationHandle);
    resolvePromise?.(controls);
    resolvePromise = null;
  };

  const kill = () => {
    status = "dead";
    ticker.remove(animationHandle);
    stopped = true;
    resolvePromise = null;
  };

  function onTickerUpdate(deltaMs: number) {
    if (stopped) return;
    if (pendingStart) {
      delayRemainingMs -= deltaMs;
      if (delayRemainingMs > 0) return;
      pendingStart = false;
      onStarted?.(state.currentValue);
      deltaMs = -delayRemainingMs;
    }
    const { from, to } = resolveValues();
    const completed = updateTween(state, deltaMs, durationMs, currentEase, from, to);
    onUpdate?.(state.currentValue, state.velocity);
    if (completed) handleCompletion();
  }

  function handleCompletion() {
    onEnded?.(state.currentValue);
    if (repeatCounter < repeatCount) {
      repeatCounter++;
      if (yoyoEnabled) isReversed = !isReversed;
      state.progress = 0;
      const { from, to } = resolveValues();
      state.currentValue = isReversed ? to : from;
      state.velocity = 0;
      onRepeat?.(state.currentValue);
      return;
    }
    status = "stopped";
    ticker.remove(animationHandle);
    resolvePromise?.(controls);
    resolvePromise = null;
  }

  const controls: AnimControls<number> = {
    play, pause, resume, stop, skipToEnd, kill,
    get from() { return rawFrom; },
    set from(v: number | (() => number)) { rawFrom = v; if (status === "playing") state.progress = 0; },
    get to() { return rawTo; },
    set to(v: number | (() => number)) { rawTo = v; if (status === "playing") state.progress = 0; },
    get ease() { return currentEase; },
    set ease(v: EaseName | EaseFunction) { currentEase = resolveEasing(v); },
    setCurrent: (value: number) => { state.currentValue = value; state.velocity = 0; },
    get currentValue() { return state.currentValue; },
    get velocity() { return state.velocity; },
    get progress() { return state.progress; },
    set progress(v: number) { state.progress = Math.max(0, Math.min(1, v)); },
    get status() { return status; },
    getDurationMs: () => durationMs,
  };

  return controls;
};

// ─── Keyframe mode ───

const createKeyframeAnimation = (options: SingleTweenOptions & { keyframes: Keyframe[] }): AnimControls<number> => {
  const keyframes = options.keyframes;
  const onUpdate = options.onUpdate;
  const onEnded = options.onEnded;

  // Sort keyframes by time
  const sorted = [...keyframes].sort((a, b) => a.at - b.at);
  const totalDurationMs = sorted[sorted.length - 1].at;

  // Resolve a keyframe's value (function or literal)
  const resolveKeyframeValue = (kf: Keyframe): number => {
    return typeof kf.value === "function" ? (kf.value as () => number)() : kf.value;
  };

  // Create segment from one keyframe to the next
  type Segment = { from: number; to: number; durationMs: number; easeFn: EaseFunction };
  const segments: Segment[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    segments.push({
      from: resolveKeyframeValue(current),
      to: resolveKeyframeValue(next),
      durationMs: next.at - current.at,
      easeFn: resolveEasing(next.ease ?? "inOutSine"),
    });
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
  let resolvePromise: ResolveFunction | null = null;
  let currentSegmentIndex = 0;

  const ticker = getTicker();
  const animationHandle = { update: onTickerUpdate };

  // Track elapsed ms within the current segment
  let segmentElapsed = 0;

  const play = (): Promise<AnimControls<number>> => {
    if (status === "dead") throw new Error("Cannot play a dead animation");
    stopped = false;
    currentSegmentIndex = 0;
    segmentElapsed = 0;
    state.progress = 0;
    state.currentValue = segments[0].from;
    state.velocity = 0;

    const promise = new Promise<AnimControls<number>>((resolve) => { resolvePromise = resolve; });
    status = "playing";
    ticker.add(animationHandle);
    return promise;
  };

  const pause = () => {
    if (status !== "playing") return;
    status = "paused";
    ticker.remove(animationHandle);
  };

  const resume = () => {
    if (status !== "paused") return;
    status = "playing";
    ticker.add(animationHandle);
  };

  const stop = () => {
    stopped = true;
    status = "stopped";
    ticker.remove(animationHandle);
    resolvePromise?.(controls);
    resolvePromise = null;
  };

  const skipToEnd = () => {
    const last = segments[segments.length - 1];
    state.currentValue = last.to;
    state.velocity = 0;
    state.progress = 1;
    if (status === "playing" || status === "paused") {
      onUpdate?.(state.currentValue, state.velocity);
      onEnded?.(state.currentValue);
    }
    status = "stopped";
    ticker.remove(animationHandle);
    resolvePromise?.(controls);
    resolvePromise = null;
  };

  const kill = () => {
    status = "dead";
    ticker.remove(animationHandle);
    stopped = true;
    resolvePromise = null;
  };

  function onTickerUpdate(deltaMs: number) {
    if (stopped) return;

    const segment = segments[currentSegmentIndex];
    segmentElapsed += deltaMs;

    const completed = updateTween(state, deltaMs, segment.durationMs, segment.easeFn, segment.from, segment.to);
    // Override progress to be global
    let elapsedTotal = 0;
    for (let i = 0; i < currentSegmentIndex; i++) {
      elapsedTotal += segments[i].durationMs;
    }
    elapsedTotal += segmentElapsed;
    state.progress = Math.min(elapsedTotal / totalDurationMs, 1);

    onUpdate?.(state.currentValue, state.velocity);

    if (completed) {
      // Move to next segment
      if (currentSegmentIndex < segments.length - 1) {
        currentSegmentIndex++;
        segmentElapsed = 0;
        state.currentValue = segments[currentSegmentIndex].from;
        state.velocity = 0;
        // Recompute global progress
        let total = 0;
        for (let i = 0; i <= currentSegmentIndex; i++) {
          total += segments[i].durationMs;
        }
        state.progress = Math.min(total / totalDurationMs, 1);
      } else {
        // All segments done
        status = "stopped";
        ticker.remove(animationHandle);
        onEnded?.(state.currentValue);
        resolvePromise?.(controls);
        resolvePromise = null;
      }
    }
  }

  const controls: AnimControls<number> = {
    play, pause, resume, stop, skipToEnd, kill,
    get from() { return segments[0]?.from ?? 0; },
    set from(_v: number | (() => number)) { /* no-op */ },
    get to() { return segments[segments.length - 1]?.to ?? 0; },
    set to(_v: number | (() => number)) { /* no-op */ },
    get ease() { return segments[segments.length - 1]?.easeFn ?? ((t: number) => t); },
    set ease(_v: EaseName | EaseFunction) { /* no-op */ },
    setCurrent: (value: number) => { state.currentValue = value; state.velocity = 0; },
    get currentValue() { return state.currentValue; },
    get velocity() { return state.velocity; },
    get progress() { return state.progress; },
    set progress(v: number) { state.progress = Math.max(0, Math.min(1, v)); },
    get status() { return status; },
    getDurationMs: () => totalDurationMs,
  };

  return controls;
};
