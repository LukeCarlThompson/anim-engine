import type { TickerControls } from "../shared/types";

/**
 * Create a ticker that drives active animations.
 *
 * Does NOT auto-start. The user must explicitly call either:
 * - `start()` — begins a `requestAnimationFrame` loop
 * - `update(deltaMs)` — drive manually from a game loop
 *
 * `add()` and `remove()` register/unregister animations without
 * side effects on the rAF loop.
 */
export const createTicker = (): TickerControls => {
  const activeAnimations = new Set<{ update: (deltaMs: number) => void }>();
  let animationFrameRequestId: number | null = null;
  let previousFrameTime: number | null = null;

  const start = () => {
    if (animationFrameRequestId !== null) return;
    previousFrameTime = null;
    const tick = (now: number) => {
      if (previousFrameTime !== null) {
        const delta = now - previousFrameTime;
        update(delta);
      }
      previousFrameTime = now;
      animationFrameRequestId = requestAnimationFrame(tick);
    };
    animationFrameRequestId = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (animationFrameRequestId !== null) {
      cancelAnimationFrame(animationFrameRequestId);
      animationFrameRequestId = null;
    }
    previousFrameTime = null;
  };

  const update = (deltaMs: number) => {
    for (const anim of activeAnimations) {
      anim.update(deltaMs);
    }
  };

  const add = (anim: { update: (deltaMs: number) => void }) => {
    activeAnimations.add(anim);
  };

  const remove = (anim: { update: (deltaMs: number) => void }) => {
    activeAnimations.delete(anim);
  };

  return { start, stop, update, add, remove };
};
