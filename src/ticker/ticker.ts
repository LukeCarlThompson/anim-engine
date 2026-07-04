export type TickHandler = (deltaMs: number) => void;

export type TickerControls = {
  start: () => void;
  stop: () => void;
  update: (deltaMs: number) => void;
  add: (handler: TickHandler) => void;
  remove: (handler: TickHandler) => void;
};

/**
 * Create a ticker that drives active animations.
 *
 * Does NOT auto-start. The user must explicitly call either:
 * - `start()` — begins a `requestAnimationFrame` loop
 * - `update(deltaMs)` — drive manually from a game loop
 *
 * `add()` and `remove()` register/unregister animations without
 * side effects on the rAF loop.
 *
 * Uses a flat array with undefined-tombstone removal for safe concurrent
 * modification during iteration. Compacted after each frame.
 */
export const createTicker = (): TickerControls => {
  const activeAnimations: (TickHandler | undefined)[] = [];
  let needsCompact = false;
  let animationFrameRequestId: number | undefined = undefined;
  let previousFrameTime: number | undefined = undefined;

  const start = () => {
    if (animationFrameRequestId !== undefined) return;
    previousFrameTime = undefined;
    const tick = (now: number) => {
      if (previousFrameTime !== undefined) {
        const delta = now - previousFrameTime;
        update(delta);
      }
      previousFrameTime = now;
      animationFrameRequestId = requestAnimationFrame(tick);
    };
    animationFrameRequestId = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (animationFrameRequestId !== undefined) {
      cancelAnimationFrame(animationFrameRequestId);
      animationFrameRequestId = undefined;
    }
    previousFrameTime = undefined;
  };

  const update = (deltaMs: number) => {
    for (let i = 0; i < activeAnimations.length; i++) {
      const anim = activeAnimations[i];
      if (anim) anim(deltaMs);
    }
    if (needsCompact) {
      let writeIndex = 0;
      for (let readIndex = 0; readIndex < activeAnimations.length; readIndex++) {
        const anim = activeAnimations[readIndex];
        if (anim !== undefined) {
          activeAnimations[writeIndex++] = anim;
        }
      }
      activeAnimations.length = writeIndex;
      needsCompact = false;
    }
  };

  const add = (handler: TickHandler) => {
    activeAnimations.push(handler);
  };

  const remove = (handler: TickHandler) => {
    const index = activeAnimations.indexOf(handler);
    if (index >= 0) {
      activeAnimations[index] = undefined;
      needsCompact = true;
    }
  };

  return { start, stop, update, add, remove };
};
