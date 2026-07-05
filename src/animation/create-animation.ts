import { easingFunctions } from "../easing/easing";
import type { Animation, DynamicValue, EaseFunction, EaseName } from "../shared/types";
import { getTicker } from "../ticker/get-ticker";
import { createKeyframeRunner, createTweenRunner } from "./runner";
import type { Runner } from "./runner";

const resolveEasing = (ease: EaseName | EaseFunction): EaseFunction =>
  typeof ease === "function" ? ease : easingFunctions[ease];

const resolveValue = (v: DynamicValue): number => (typeof v === "function" ? v() : v);

type ResolveFunction = (value: Animation) => void;

export type SingleTweenOptions = {
  from: DynamicValue;
  to: DynamicValue;
  durationMs: DynamicValue;
  ease?: EaseName | EaseFunction;
  onStarted?: () => void;
  onUpdate?: (value: number, velocity: number) => void;
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

const isKeyframeMode = (options: AnimationOptions): options is KeyframeAnimationOptions => {
  return "keyframes" in options && Array.isArray(options.keyframes);
};

export const createAnimation = (options: AnimationOptions): Animation => {
  if (isKeyframeMode(options)) {
    return createKeyframeAnimation(options);
  }
  return createSingleTween(options);
};

// ─── Single-tween mode ───

const createSingleTween = (options: SingleTweenOptions): Animation => {
  const easeName: EaseName | EaseFunction = options.ease ?? "inOutSine";
  const { onStarted, onUpdate, onEnded } = options;
  const rawFrom = options.from;
  const rawTo = options.to;
  const rawDurationMs = options.durationMs;

  let cachedDurationMs = resolveValue(rawDurationMs);
  let status: "playing" | "paused" | "stopped" | "dead" = "stopped";
  let resolvePromise: ResolveFunction | undefined;

  const ticker = getTicker();

  let runner: Runner;

  const finish = () => {
    status = "stopped";
    ticker.remove(runner);
    resolvePromise?.(controls);
    resolvePromise = undefined;
  };

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
      onEnded,
      onComplete: finish,
    });
  };

  const hasDynamic =
    typeof rawFrom === "function" ||
    typeof rawTo === "function" ||
    typeof rawDurationMs === "function";

  runner = buildRunner();

  const play = (): Promise<Animation> => {
    if (status === "dead") throw new Error("Cannot play a dead animation");
    if (hasDynamic) runner = buildRunner();
    else runner.reset();
    const promise = new Promise<Animation>((resolve) => {
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
    resolvePromise?.(controls);
    resolvePromise = undefined;
  };

  const skipToEnd = () => {
    runner.evaluate(1);
    if (status === "playing" || status === "paused") onEnded?.();
    status = "stopped";
    ticker.remove(runner);
    resolvePromise?.(controls);
    resolvePromise = undefined;
  };

  const kill = () => {
    status = "dead";
    ticker.remove(runner);
    resolvePromise = undefined;
  };

  const controls: Animation = {
    play,
    pause,
    resume,
    stop,
    skipToEnd,
    kill,
    get currentValue() {
      return runner.currentValue;
    },
    get velocity() {
      return runner.velocity;
    },
    get progress() {
      return runner.progress;
    },
    setProgress(value: number) {
      if (status === "playing") pause();
      runner.evaluate(Math.max(0, Math.min(1, value)));
    },
    get status() {
      return status;
    },
    get durationMs() {
      return cachedDurationMs;
    },
  };

  return controls;
};

// ─── Keyframe mode ───

const createKeyframeAnimation = (options: KeyframeAnimationOptions): Animation => {
  const { keyframes: rawKeyframes, onStarted, onUpdate, onProgress, onEnded } = options;

  const resolveKeyframeGaps = (): number => {
    let total = 0;
    for (let i = 1; i < rawKeyframes.length; i++) {
      total += resolveValue(rawKeyframes[i].gap ?? 0);
    }
    return total;
  };

  let cachedDurationMs = resolveKeyframeGaps();
  let status: "playing" | "paused" | "stopped" | "dead" = "stopped";
  let resolvePromise: ResolveFunction | undefined;

  const ticker = getTicker();

  let runner: Runner;

  const finish = () => {
    status = "stopped";
    ticker.remove(runner);
    resolvePromise?.(controls);
    resolvePromise = undefined;
  };

  const buildRunner = (): Runner => {
    const resolvedKeyframes = rawKeyframes.map((kf, i) => ({
      value: resolveValue(kf.value),
      gap: i === 0 ? 0 : resolveValue(kf.gap ?? 0),
      easeFn: resolveEasing(kf.ease ?? "inOutSine"),
    }));
    return createKeyframeRunner({
      keyframes: resolvedKeyframes,
      onStarted,
      onUpdate,
      onProgress,
      onEnded,
      onComplete: finish,
    });
  };

  const hasDynamic = rawKeyframes.some(
    (kf) => typeof kf.value === "function" || typeof kf.gap === "function",
  );

  runner = buildRunner();

  const play = (): Promise<Animation> => {
    if (status === "dead") throw new Error("Cannot play a dead animation");
    if (hasDynamic) {
      runner = buildRunner();
      cachedDurationMs = resolveKeyframeGaps();
    } else {
      runner.reset();
    }
    const promise = new Promise<Animation>((resolve) => {
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
    resolvePromise?.(controls);
    resolvePromise = undefined;
  };

  const skipToEnd = () => {
    runner.evaluate(1);
    if (status === "playing" || status === "paused") onEnded?.();
    status = "stopped";
    ticker.remove(runner);
    resolvePromise?.(controls);
    resolvePromise = undefined;
  };

  const kill = () => {
    status = "dead";
    ticker.remove(runner);
    resolvePromise = undefined;
  };

  const controls: Animation = {
    play,
    pause,
    resume,
    stop,
    skipToEnd,
    kill,
    get currentValue() {
      return runner.currentValue;
    },
    get velocity() {
      return runner.velocity;
    },
    get progress() {
      return runner.progress;
    },
    setProgress(value: number) {
      if (status === "playing") pause();
      runner.evaluate(Math.max(0, Math.min(1, value)));
    },
    get status() {
      return status;
    },
    get durationMs() {
      return cachedDurationMs;
    },
  };

  return controls;
};
