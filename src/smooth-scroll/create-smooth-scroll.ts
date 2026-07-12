import type { SmoothScroll, SmoothScrollOptions, InterpolationStatus } from "../domain";
import { resolveValue } from "../domain";
import { smoothDampStep } from "../smooth-damp/step";
import { getTicker } from "../ticker";

/**
 * Momentum scroll built on top of `smoothDampStep`.
 *
 * Manages an internal target clamped on write so there's no
 * dead zone when coming back from overscroll. The value
 * smooth-damps toward the target every frame.
 *
 * Self-registers on the ticker while animating, removes itself
 * when settled — no explicit lifecycle management needed.
 *
 * ```
 * const s = createSmoothScroll({ min: 0, max: 500, onUpdate: ... });
 * s.setValue(s.value);    // pointer down — re-sync
 * s.addDelta(e.deltaY);   // wheel
 * s.addDelta(-dx);        // pointer move
 * ```
 */
export const createSmoothScroll = ({
  smoothTimeMs = 80,
  precision = 0.1,
  min: rawMin,
  max: rawMax,
  onUpdate,
  onEnded,
  ticker = getTicker(),
}: SmoothScrollOptions): SmoothScroll => {
  const state = { current: 0, velocity: 0 };
  let scrollTarget = 0;
  let hasEnded = false;
  let onTicker = false;

  const getMin = (): number | undefined =>
    rawMin !== undefined ? resolveValue(rawMin) : undefined;
  const getMax = (): number | undefined =>
    rawMax !== undefined ? resolveValue(rawMax) : undefined;

  const clamp = (v: number): number => {
    const mn = getMin();
    const mx = getMax();
    if (mn !== undefined) v = Math.max(mn, v);
    if (mx !== undefined) v = Math.min(mx, v);
    return v;
  };

  function ensureOnTicker() {
    if (!onTicker) {
      ticker.add(update);
      onTicker = true;
    }
  }

  function update(deltaMs: number) {
    smoothDampStep(state, scrollTarget, resolveValue(smoothTimeMs), Infinity, deltaMs);
    onUpdate?.(state.current, state.velocity);

    const settled =
      Math.abs(state.current - scrollTarget) < precision && Math.abs(state.velocity) < precision;

    if (settled) {
      state.velocity = 0;
      ticker.remove(update);
      onTicker = false;
      if (!hasEnded) {
        hasEnded = true;
        onEnded?.();
      }
    } else {
      hasEnded = false;
    }
  }

  return {
    setValue: (value: number) => {
      state.current = value;
      scrollTarget = value;
      state.velocity = 0;
    },
    addDelta: (delta: number) => {
      scrollTarget = clamp(scrollTarget + delta);
      ensureOnTicker();
    },
    get value() {
      return state.current;
    },
    get velocity() {
      return state.velocity;
    },
    get status(): InterpolationStatus {
      return onTicker ? "active" : "inactive";
    },
  };
};
