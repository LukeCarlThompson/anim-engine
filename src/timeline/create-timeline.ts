import type { AnimControls } from "../shared/types";

export type TimelineKeyframe =
  | {
      at: number;
      animations: AnimControls<number>[];
    }
  | {
      gap: number;
      animations: AnimControls<number>[];
    };

export type TimelineOptions = {
  keyframes: TimelineKeyframe[];
  onStarted?: () => void;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
};

export type TimelineHandle = {
  play: () => Promise<TimelineHandle>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipToEnd: () => void;
  kill: () => void;
  progress: number;
  status: "playing" | "paused" | "stopped" | "dead";
  getDurationMs: () => number;
};
import { getTicker } from "../ticker/get-ticker";

type Batch = {
  anims: AnimControls<number>[];
  startAt: number;
  endAt: number;
  started: boolean;
};

type Resolve = (value: TimelineHandle) => void;

export type Timeline = TimelineHandle;

export const createTimeline = (options: TimelineOptions): TimelineHandle => {
  const { onStarted, onProgress, onEnded } = options;

  // Derive batches from keyframes
  const batches: Batch[] = [];
  let lastBatchEnd = 0;

  for (const keyframe of options.keyframes) {
    const startAt = 'at' in keyframe ? keyframe.at : lastBatchEnd + keyframe.gap;
    const maxDuration = Math.max(...keyframe.animations.map((a) => a.getDurationMs()));
    const endAt = startAt + maxDuration;
    batches.push({ anims: keyframe.animations, startAt, endAt, started: false });
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
  const animationHandle = { update: onTickerUpdate };

  // ─── Lifecycle ───

  const play = (): Promise<TimelineHandle> => {
    if (status === "dead") throw new Error("Cannot play a dead timeline");
    elapsedMs = 0;
    pendingAnimations = 0;
    batches.forEach((b) => {
      b.started = false;
    });
    const promise = new Promise<TimelineHandle>((resolve) => {
      resolvePromise = resolve;
    });
    status = "playing";
    onStarted?.();
    ticker.add(animationHandle);
    return promise;
  };

  const pause = () => {
    if (status !== "playing") return;
    status = "paused";
    ticker.remove(animationHandle);
    for (const batch of batches) {
      if (batch.started) {
        for (const anim of batch.anims) {
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
        for (const anim of batch.anims) {
          if (anim.status === "paused") anim.resume();
        }
      }
    }
    ticker.add(animationHandle);
  };

  const stop = () => {
    if (status !== "playing" && status !== "paused") return;
    status = "stopped";
    ticker.remove(animationHandle);
    for (const batch of batches) {
      if (batch.started) {
        for (const anim of batch.anims) {
          anim.stop();
        }
      }
    }
    resolvePromise?.(handle);
    resolvePromise = undefined;
  };

  const skipToEnd = () => {
    status = "stopped";
    ticker.remove(animationHandle);
    for (const batch of batches) {
      for (const anim of batch.anims) {
        anim.skipToEnd();
      }
    }
    onEnded?.();
    resolvePromise?.(handle);
    resolvePromise = undefined;
  };

  const kill = () => {
    status = "dead";
    ticker.remove(animationHandle);
    for (const batch of batches) {
      for (const anim of batch.anims) {
        anim.kill();
      }
    }
    resolvePromise = undefined;
  };

  // ─── Ticker callback ───

  function onTickerUpdate(deltaMs: number) {
    if (status !== "playing") return;
    elapsedMs += deltaMs;

    for (const batch of batches) {
      if (!batch.started && elapsedMs >= batch.startAt) {
        batch.started = true;
        pendingAnimations += batch.anims.length;
        for (const anim of batch.anims) {
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
  }

  function checkComplete() {
    if (pendingAnimations <= 0 && status === "playing" && batches.every((b) => b.started)) {
      finish();
    }
  }

  function finish() {
    status = "stopped";
    ticker.remove(animationHandle);
    onEnded?.();
    resolvePromise?.(handle);
    resolvePromise = undefined;
  }

  const getDurationMs = () => totalDurationMs;

  const handle: TimelineHandle = {
    play,
    pause,
    resume,
    stop,
    skipToEnd,
    kill,
    get progress() {
      return totalDurationMs > 0 ? Math.min(elapsedMs / totalDurationMs, 1) : 0;
    },
    get status() {
      return status;
    },
    getDurationMs,
  };

  return handle;
};
