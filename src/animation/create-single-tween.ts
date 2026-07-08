import { resolveEasing, resolveValue } from "../domain";
import type { EaseName, AnimationStatus, DynamicValue, EaseFunction } from "../domain";
import { getTicker } from "../ticker";
import { createTweenRunner } from "./runner";
import type { Runner } from "./runner";

export type SingleTweenOptions = {
  from: DynamicValue;
  to: DynamicValue;
  durationMs: DynamicValue;
  ease?: EaseName | EaseFunction;
  onStarted?: () => void;
  onUpdate?: (value: number, velocity: number) => void;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
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

// ─── Single-tween mode ───

export const createSingleTween = ({
  onStarted,
  onUpdate,
  onProgress,
  onEnded,
  from: rawFrom,
  to: rawTo,
  durationMs: rawDurationMs,
  ease: easeName = "inOutSine",
}: SingleTweenOptions): Animation => {
  let cachedDurationMs = resolveValue(rawDurationMs);
  let status: AnimationStatus = "stopped";
  const hasDynamicProperty =
    typeof rawFrom === "function" ||
    typeof rawTo === "function" ||
    typeof rawDurationMs === "function";
  let resolvePromise: (() => void) | undefined;

  const ticker = getTicker();

  const handleEnded = () => {
    status = "stopped";
    ticker.remove(runner);
    resolvePromise?.();
    onEnded?.();
    resolvePromise = undefined;
  };

  let runner: Runner;

  const buildRunner = (): Runner => {
    const from = resolveValue(rawFrom);
    const to = resolveValue(rawTo);
    cachedDurationMs = resolveValue(rawDurationMs);
    return createTweenRunner({
      from,
      to,
      durationMs: cachedDurationMs,
      easeFn: resolveEasing(easeName),
      onStarted,
      onUpdate,
      onProgress,
      onEnded: handleEnded,
    });
  };

  runner = buildRunner();

  const play = (): Promise<void> => {
    if (hasDynamicProperty) {
      runner = buildRunner();
    } else {
      runner.reset();
    }

    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    status = "playing";
    ticker.add(runner);
    onStarted?.();
    return promise;
  };

  const pause = () => {
    if (status !== "playing") return;
    status = "paused";
    ticker.remove(runner);
  };

  const resume = () => {
    if (status !== "paused") return;
    status = "playing";
    ticker.add(runner);
  };

  const stop = () => {
    status = "stopped";
    ticker.remove(runner);
    resolvePromise?.();
    resolvePromise = undefined;
  };

  const skipToEnd = () => {
    runner.evaluate(1);
    if (status === "playing" || status === "paused") onEnded?.();
    status = "stopped";
    ticker.remove(runner);
    resolvePromise?.();
    resolvePromise = undefined;
  };

  const setProgress = (value: number) => {
    if (status === "playing") {
      pause();
    }
    runner.evaluate(Math.max(0, Math.min(1, value)));
  };

  const animation: Animation = {
    play,
    pause,
    resume,
    stop,
    skipToEnd,
    get value() {
      return runner.value;
    },
    get velocity() {
      return runner.velocity;
    },
    get progress() {
      return runner.progress;
    },
    setProgress,
    get status() {
      return status;
    },
    get durationMs() {
      return cachedDurationMs;
    },
  };

  return animation;
};
