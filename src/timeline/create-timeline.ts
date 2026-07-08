import { createKeyframeRunner } from "../animation/runner";
import type { Runner } from "../animation/runner";
import type {
  TimelineLayer,
  Timeline,
  TimelineCallbacks,
  ExternalTicker,
  AnimationStatus,
} from "../domain";
import { resolveEasing, resolveValue } from "../domain";
import { getTicker } from "../ticker";

const noOp = () => {};

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

/**
 * Creates a timeline animation that sequences multiple keyframe animation
 * layers, each starting at a specified time or gap after the previous layer.
 *
 * The timeline aggregates all layers into a single controllable animation
 * with its own play/pause/resume/stop semantics and returns the combined
 * values and velocities of all layers on each update.
 *
 * @param layers - An array of {@link TimelineLayer} configs describing each
 *   animation in the sequence and when it should play.
 * @param callbacks - Optional callback hooks and configuration.
 * @param ticker - An optional external ticker. Defaults to the global ticker.
 * @returns A {@link Timeline} instance for controlling the sequenced animation.
 */
export const createTimeline = (
  layers: TimelineLayer[],
  { onStarted, onUpdate, onEnded, onProgress = noOp }: TimelineCallbacks = {},
  ticker: ExternalTicker = getTicker(),
): Timeline => {
  const rawLayers = layers;

  let state = buildFromConfigs(rawLayers);
  let activeLayers = state.activeLayers;
  let totalDurationMs = state.totalDurationMs;

  let valuesCache: number[] = [];
  let velocitiesCache: number[] = [];
  const syncValues = () => {
    valuesCache.length = activeLayers.length;
    velocitiesCache.length = activeLayers.length;
    for (let i = 0; i < activeLayers.length; i++) {
      valuesCache[i] = activeLayers[i].runner.velocity;
      velocitiesCache[i] = activeLayers[i].runner.velocity;
    }
  };
  syncValues();

  let timelineStatus: AnimationStatus = "stopped";
  let elapsedMs = 0;
  let resolvePromise: (() => void) | undefined;
  let remainingLayers = activeLayers.length;

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

    syncValues();
    onUpdate?.(valuesCache, velocitiesCache);

    onProgress(totalDurationMs > 0 ? Math.min(elapsedMs / totalDurationMs, 1) : 1);

    if (remainingLayers <= 0) finish();
  };

  const play = (): Promise<void> => {
    state = buildFromConfigs(rawLayers);
    activeLayers = state.activeLayers;
    totalDurationMs = state.totalDurationMs;
    remainingLayers = activeLayers.length;
    valuesCache = [];
    velocitiesCache = [];
    syncValues();
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
    syncValues();
    timelineStatus = "stopped";
    ticker.remove(update);
    onEnded?.();
    resolvePromise?.();
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

    syncValues();

    remainingLayers = activeLayers.filter((l) => !l.ended).length;
  };

  const timeline: Timeline = {
    play,
    pause,
    resume,
    stop,
    skipToEnd,
    setProgress,
    get progress() {
      return totalDurationMs > 0 ? Math.min(elapsedMs / totalDurationMs, 1) : 1;
    },
    get values() {
      return valuesCache;
    },
    get velocities() {
      return velocitiesCache;
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
