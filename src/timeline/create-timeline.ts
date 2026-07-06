import type { KeyframeAnimationOptions } from "../animation/create-animation";
import { createKeyframeRunner } from "../animation/runner";
import type { Runner } from "../animation/runner";
import { resolveEasing } from "../easing/easing";
import { resolveValue } from "../resolve-value";
import type { AnimationStatus, DynamicValue } from "../shared-types";
import { getTicker } from "../ticker/get-ticker";

export type TimelineLayer =
  | { animation: KeyframeAnimationOptions; at: DynamicValue }
  | { animation: KeyframeAnimationOptions; gap: number };

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
};

const noop = () => {};

type ActiveLayer = {
  startAt: number;
  endAt: number;
  runner: Runner;
  started: boolean;
  ended: boolean;
};

type BuildResult = {
  activeLayers: ActiveLayer[];
  totalDurationMs: number;
};

const buildFromConfigs = (rawLayers: TimelineLayer[]): BuildResult => {
  const activeLayers: ActiveLayer[] = [];
  let previousEndAt = 0;

  for (const layer of rawLayers) {
    const startAt = "at" in layer ? resolveValue(layer.at) : previousEndAt + layer.gap;

    const kfs = layer.animation.keyframes;
    const resolvedKeyframes = kfs.map((kf, j) => ({
      value: resolveValue(kf.value),
      gap: j === 0 ? 0 : resolveValue(kf.gap ?? 0),
      easeFn: resolveEasing(kf.ease ?? "inOutSine"),
    }));

    let layerDuration = 0;
    for (let i = 1; i < resolvedKeyframes.length; i++) {
      layerDuration += resolvedKeyframes[i].gap;
    }

    const runner = createKeyframeRunner({
      keyframes: resolvedKeyframes,
      onStarted: layer.animation.onStarted,
      onUpdate: layer.animation.onUpdate,
      onProgress: layer.animation.onProgress,
      onEnded: layer.animation.onEnded,
    });

    activeLayers.push({
      startAt,
      endAt: startAt + layerDuration,
      runner,
      started: false,
      ended: false,
    });

    previousEndAt = startAt + layerDuration;
  }

  activeLayers.sort((a, b) => a.startAt - b.startAt);

  const totalDurationMs = Math.max(0, ...activeLayers.map((l) => l.endAt));

  return { activeLayers, totalDurationMs };
};

export const createTimeline = (
  layers: TimelineLayer[],
  options?: {
    onStarted?: () => void;
    onProgress?: (progress: number) => void;
    onEnded?: () => void;
  },
): Timeline => {
  const { onStarted, onEnded } = options ?? {};
  const onProgress = options?.onProgress ?? noop;
  const rawLayers = layers;

  let state = buildFromConfigs(rawLayers);
  let activeLayers = state.activeLayers;
  let totalDurationMs = state.totalDurationMs;

  let timelineStatus: "playing" | "paused" | "stopped" | "dead" = "stopped";
  let elapsedMs = 0;
  let resolvePromise: (() => void) | undefined;
  let remainingLayers = activeLayers.length;

  const ticker = getTicker();

  const finish = () => {
    timelineStatus = "stopped";
    ticker.remove(update);
    onEnded?.();
    resolvePromise?.();
    resolvePromise = undefined;
  };

  const update = (deltaMs: number) => {
    elapsedMs += deltaMs;

    for (const layer of activeLayers) {
      if (!layer.started && elapsedMs >= layer.startAt) {
        layer.runner.reset();
        layer.runner.onStarted?.();
        layer.started = true;
      }

      if (layer.started && !layer.ended) {
        if (layer.runner(deltaMs)) {
          layer.ended = true;
          remainingLayers--;
        }
      }
    }

    onProgress(totalDurationMs > 0 ? Math.min(elapsedMs / totalDurationMs, 1) : 1);

    if (remainingLayers <= 0) finish();
  };

  const play = (): Promise<void> => {
    if (timelineStatus === "dead") throw new Error("Cannot play a dead timeline");

    state = buildFromConfigs(rawLayers);
    activeLayers = state.activeLayers;
    totalDurationMs = state.totalDurationMs;
    remainingLayers = activeLayers.length;
    elapsedMs = 0;

    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    timelineStatus = "playing";
    onStarted?.();
    ticker.add(update);
    return promise;
  };

  const pause = () => {
    if (timelineStatus !== "playing") return;
    timelineStatus = "paused";
    ticker.remove(update);
  };

  const resume = () => {
    if (timelineStatus !== "paused") return;
    timelineStatus = "playing";
    ticker.add(update);
  };

  const stop = () => {
    if (timelineStatus !== "playing" && timelineStatus !== "paused") return;
    timelineStatus = "stopped";
    ticker.remove(update);
    resolvePromise?.();
    resolvePromise = undefined;
  };

  const skipToEnd = () => {
    for (const layer of activeLayers) {
      layer.runner.evaluate(1);
      layer.runner.onEnded?.();
    }
    timelineStatus = "stopped";
    ticker.remove(update);
    onEnded?.();
    resolvePromise?.();
    resolvePromise = undefined;
  };

  const kill = () => {
    timelineStatus = "dead";
    ticker.remove(update);
    resolvePromise = undefined;
  };

  const setProgress = (value: number) => {
    if (timelineStatus === "playing") pause();

    const clamped = Math.max(0, Math.min(1, value));
    elapsedMs = clamped * totalDurationMs;

    for (const layer of activeLayers) {
      if (elapsedMs < layer.startAt) {
        layer.runner.evaluate(0);
        layer.started = false;
        layer.ended = false;
      } else {
        layer.started = true;
        const layerDuration = layer.endAt - layer.startAt;
        const localProgress =
          layerDuration > 0 ? Math.min((elapsedMs - layer.startAt) / layerDuration, 1) : 1;
        layer.runner.evaluate(localProgress);
        layer.ended = localProgress >= 1;
      }
    }

    remainingLayers = activeLayers.filter((l) => !l.ended).length;
  };

  const timeline: Timeline = {
    play,
    pause,
    resume,
    stop,
    skipToEnd,
    kill,
    setProgress,
    get progress() {
      return totalDurationMs > 0 ? Math.min(elapsedMs / totalDurationMs, 1) : 1;
    },
    get status() {
      return timelineStatus;
    },
    get durationMs() {
      return totalDurationMs;
    },
  };

  return timeline;
};
