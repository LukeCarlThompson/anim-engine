import { easingFunctions } from "../easing/easing";
import type { AnimationStatus, DynamicValue, EaseFunction, EaseName } from "../shared/types";
import { getTicker } from "../ticker/get-ticker";
import { createKeyframeRunner, createTweenRunner } from "./runner";
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
  kill: () => void;

  currentValue: number;
  velocity: number;
  progress: number;
  setProgress: (value: number) => void;
  status: AnimationStatus;
  durationMs: number;
};

const resolveEasing = (ease: EaseName | EaseFunction): EaseFunction =>
  typeof ease === "function" ? ease : easingFunctions[ease];

const resolveValue = (value: DynamicValue): number =>
  typeof value === "function" ? value() : value;

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

const createSingleTween = ({
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
    if (status === "dead") {
      throw new Error("Cannot play a dead animation");
    }
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

  const kill = () => {
    status = "dead";
    ticker.remove(runner);
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

// ─── Keyframe mode ───

const createKeyframeAnimation = ({
  keyframes: rawKeyframes,
  onStarted,
  onUpdate,
  onProgress,
  onEnded,
}: KeyframeAnimationOptions): Animation => {
  const resolveKeyframeGaps = (): number => {
    let total = 0;
    for (let i = 1; i < rawKeyframes.length; i++) {
      total += resolveValue(rawKeyframes[i].gap ?? 0);
    }
    return total;
  };

  let cachedDurationMs = resolveKeyframeGaps();
  let status: AnimationStatus = "stopped";
  let resolvePromise: (() => void) | undefined;

  const hasDynamicProperty = rawKeyframes.some(
    (kf) => typeof kf.value === "function" || typeof kf.gap === "function",
  );

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
      onEnded: handleEnded,
    });
  };

  runner = buildRunner();

  const play = (): Promise<void> => {
    if (status === "dead") throw new Error("Cannot play a dead animation");
    if (hasDynamicProperty) {
      runner = buildRunner();
      cachedDurationMs = resolveKeyframeGaps();
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

  const kill = () => {
    status = "dead";
    ticker.remove(runner);
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
