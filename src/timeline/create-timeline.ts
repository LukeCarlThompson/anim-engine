import type { Animation, AnimationStatus } from "../shared/types";

export type TimelineLayer =
  | {
      at: number;
      animation: Animation | Animation[];
    }
  | {
      gap: number;
      animation: Animation | Animation[];
    };

export type Timeline = {
  play: () => Promise<Timeline>;
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
import { getTicker } from "../ticker/get-ticker";

type Batch = {
  animations: Animation[];
  startAt: number;
  endAt: number;
  started: boolean;
};

type Resolve = (value: Timeline) => void;

export const createTimeline = (
  layers: TimelineLayer[],
  options?: {
    onStarted?: () => void;
    onProgress?: (progress: number) => void;
    onEnded?: () => void;
  },
): Timeline => {
  const { onStarted, onProgress, onEnded } = options ?? {};

  // Derive batches from layers
  const batches: Batch[] = [];
  let lastBatchEnd = 0;

  for (const layer of layers) {
    const anims = Array.isArray(layer.animation) ? layer.animation : [layer.animation];
    const startAt = "at" in layer ? layer.at : lastBatchEnd + layer.gap;
    const maxDuration = Math.max(...anims.map((a) => a.durationMs));
    const endAt = startAt + maxDuration;
    batches.push({ animations: anims, startAt, endAt, started: false });
    lastBatchEnd = endAt;
  }

  batches.sort((a, b) => a.startAt - b.startAt);
  const totalDurationMs = Math.max(0, ...batches.map((b) => b.endAt));

  // State
  let status: "playing" | "paused" | "stopped" | "dead" = "stopped";
  let elapsedMs = 0;
  let resolvePromise: Resolve | undefined;
  let pendingAnimations = 0;

  const ticker = getTicker();

  // ─── Lifecycle ───

  const play = (): Promise<Timeline> => {
    if (status === "dead") throw new Error("Cannot play a dead timeline");
    elapsedMs = 0;
    pendingAnimations = 0;
    batches.forEach((b) => {
      b.started = false;
    });
    const promise = new Promise<Timeline>((resolve) => {
      resolvePromise = resolve;
    });
    status = "playing";
    onStarted?.();
    ticker.add(update);
    return promise;
  };

  const pause = () => {
    if (status !== "playing") return;
    status = "paused";
    ticker.remove(update);
    for (const batch of batches) {
      if (batch.started) {
        for (const anim of batch.animations) {
          if (anim.status === "playing") anim.pause();
        }
      }
    }
  };

  const resume = () => {
    if (status !== "paused") return;
    status = "playing";
    for (const batch of batches) {
      if (batch.started) {
        for (const anim of batch.animations) {
          if (anim.status === "paused") anim.resume();
        }
      }
    }
    ticker.add(update);
  };

  const stop = () => {
    if (status !== "playing" && status !== "paused") return;
    status = "stopped";
    ticker.remove(update);
    for (const batch of batches) {
      if (batch.started) {
        for (const anim of batch.animations) {
          anim.stop();
        }
      }
    }
    resolvePromise?.(timeline);
    resolvePromise = undefined;
  };

  const skipToEnd = () => {
    status = "stopped";
    ticker.remove(update);
    for (const batch of batches) {
      for (const anim of batch.animations) {
        anim.skipToEnd();
      }
    }
    onEnded?.();
    resolvePromise?.(timeline);
    resolvePromise = undefined;
  };

  const kill = () => {
    status = "dead";
    ticker.remove(update);
    for (const batch of batches) {
      for (const anim of batch.animations) {
        anim.kill();
      }
    }
    resolvePromise = undefined;
  };

  // ─── Ticker callback ───

  const update = (deltaMs: number) => {
    if (status !== "playing") return;
    elapsedMs += deltaMs;

    for (const batch of batches) {
      if (!batch.started && elapsedMs >= batch.startAt) {
        batch.started = true;
        pendingAnimations += batch.animations.length;
        for (const anim of batch.animations) {
          void anim.play().then(() => {
            pendingAnimations--;
            checkComplete();
          });
        }
      }
    }

    onProgress?.(totalDurationMs > 0 ? Math.min(elapsedMs / totalDurationMs, 1) : 0);

    if (batches.every((b) => b.started) && pendingAnimations <= 0) {
      finish();
    }
  };

  const checkComplete = () => {
    if (pendingAnimations <= 0 && status === "playing" && batches.every((b) => b.started)) {
      finish();
    }
  };

  const finish = () => {
    status = "stopped";
    ticker.remove(update);
    onEnded?.();
    resolvePromise?.(timeline);
    resolvePromise = undefined;
  };

  const setProgress = (value: number) => {
    if (status === "playing") pause();

    const clamped = Math.max(0, Math.min(1, value));
    elapsedMs = clamped * totalDurationMs;

    for (const batch of batches) {
      if (elapsedMs < batch.startAt) {
        for (const anim of batch.animations) {
          anim.setProgress(0);
        }
        batch.started = false;
      } else {
        batch.started = true;
        const batchElapsed = elapsedMs - batch.startAt;
        for (const anim of batch.animations) {
          const localProgress =
            anim.durationMs > 0 ? Math.min(batchElapsed / anim.durationMs, 1) : 1;
          anim.setProgress(localProgress);
        }
      }
    }
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
      return totalDurationMs > 0 ? Math.min(elapsedMs / totalDurationMs, 1) : 0;
    },
    get status() {
      return status;
    },
    get durationMs() {
      return totalDurationMs;
    },
  };

  return timeline;
};
