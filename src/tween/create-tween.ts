import type { AnimControls, TweenOptions } from "../shared/types";
import type { EaseFunction, EaseName } from "../shared/types";
import { getTicker } from "../ticker/get-ticker";
import { resolveEasing } from "../easing/easing";
import { updateTween } from "./update";
import type { TweenState } from "./update";

type ResolveFunction = (value: AnimControls<number>) => void;

export const animate = (options: TweenOptions): AnimControls<number> => {
  // Resolve defaults
  const durationMs = options.durationMs ?? 1000;
  const easeName: EaseName | EaseFunction = options.ease ?? "inOutSine";
  const repeatCount = options.repeat ?? 0;
  const yoyoEnabled = options.yoyo ?? false;
  const delayMs = options.delayMs ?? 0;
  const onStarted = options.onStarted;
  const onUpdate = options.onUpdate;
  const onEnded = options.onEnded;
  const onRepeat = options.onRepeat;

  // Raw from/to — store the original value or function
  let rawFrom: number | (() => number) = options.from ?? 0;
  let rawTo: number | (() => number) = options.to;

  // Mutable state — updated each frame
  const state: TweenState = { progress: 0, currentValue: 0, velocity: 0 };

  // Lifecycle
  let status: "playing" | "paused" | "stopped" | "dead" = "stopped";
  let stopped = false;
  let resolvePromise: ResolveFunction | null = null;
  let repeatCounter = 0;
  let isReversed = false;
  let delayRemainingMs = 0;
  let pendingStart = false;

  const ticker = getTicker();
  const animationHandle = { update: onTickerUpdate };

  // Resolve concrete from/to values from functions
  const resolveValues = () => {
    const from = typeof rawFrom === "function" ? (rawFrom as () => number)() : rawFrom;
    const to = typeof rawTo === "function" ? (rawTo as () => number)() : rawTo;
    return { from, to };
  };

  // Easing
  let currentEase: EaseFunction = resolveEasing(easeName);

  // ---- Core lifecycle ----

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

    const promise = new Promise<AnimControls<number>>((resolve) => {
      resolvePromise = resolve;
    });

    status = "playing";
    ticker.add(animationHandle);

    if (delayRemainingMs <= 0) {
      onStarted?.(state.currentValue);
    }

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
    resolvePromise = null; // Don't resolve — leave promise hanging
  };

  // ---- Ticker callback ----

  function onTickerUpdate(deltaMs: number) {
    if (stopped) return;

    // Handle delay
    if (pendingStart) {
      delayRemainingMs -= deltaMs;
      if (delayRemainingMs > 0) return;
      pendingStart = false;
      onStarted?.(state.currentValue);
      // Use any leftover negative time as first frame's delta
      deltaMs = -delayRemainingMs;
    }

    const { from, to } = resolveValues();

    const completed = updateTween(state, deltaMs, durationMs, currentEase, from, to);

    onUpdate?.(state.currentValue, state.velocity);

    if (completed) {
      handleCompletion();
    }
  }

  // ---- Completion / repeat / yoyo ----

  function handleCompletion() {
    onEnded?.(state.currentValue);

    // Repeat
    if (repeatCounter < repeatCount) {
      repeatCounter++;
      if (yoyoEnabled) {
        isReversed = !isReversed;
      }
      state.progress = 0;
      const { from, to } = resolveValues();
      state.currentValue = isReversed ? to : from;
      state.velocity = 0;
      onRepeat?.(state.currentValue);
      return; // Continue running — not done yet
    }

    // Done
    status = "stopped";
    ticker.remove(animationHandle);
    resolvePromise?.(controls);
    resolvePromise = null;
  }

  // ---- Properties ----

  const controls: AnimControls<number> = {
    play,
    pause,
    resume,
    stop,
    skipToEnd,
    kill,

    get from() { return rawFrom; },
    set from(v: number | (() => number)) {
      rawFrom = v;
      if (status === "playing") {
        state.progress = 0;
      }
    },

    get to() { return rawTo; },
    set to(v: number | (() => number)) {
      rawTo = v;
      if (status === "playing") {
        state.progress = 0;
      }
    },

    get ease() { return currentEase; },
    set ease(v: EaseName | EaseFunction) {
      currentEase = resolveEasing(v);
    },

    setCurrent: (value: number) => {
      state.currentValue = value;
      state.velocity = 0;
    },

    get currentValue() { return state.currentValue; },
    get velocity() { return state.velocity; },
    get progress() { return state.progress; },
    set progress(v: number) { state.progress = Math.max(0, Math.min(1, v)); },
    get status() { return status; },
    getDurationMs: () => durationMs,
  };

  return controls;
};
