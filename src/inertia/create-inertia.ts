import type { Inertia, InertiaOptions, InterpolationStatus } from "../domain";
import { resolveValue } from "../domain";
import { getTicker } from "../ticker";

/**
 * Velocity-decay inertia for drag-to-throw gestures.
 *
 * Call `track(position)` every frame while dragging — it records
 * position and computes velocity from the frame-to-frame delta.
 * On release call `release()` — velocity decays exponentially
 * and the value coasts to a stop.
 *
 * Self-registers on the ticker while active, removes itself when
 * settled — no explicit lifecycle management needed.
 *
 * ```
 * const inertia = createInertia({ decelerationMs: 300, onUpdate: ... });
 * inertia.track(e.clientX);   // during drag
 * inertia.release();           // on release — coasts to stop
 * ```
 */
export const createInertia = ({
  decelerationMs: rawDecelerationMs = 300,
  precision = 0.1,
  onUpdate,
  onEnded,
  ticker = getTicker(),
}: InertiaOptions): Inertia => {
  const state = { current: 0, velocity: 0 };
  let isCoasting = false;
  let lastPosition: number | undefined;
  let lastFrameTime = 0;
  let onTicker = false;

  function update(deltaMs: number) {
    if (isCoasting) {
      const decelerationMs = resolveValue(rawDecelerationMs);
      state.velocity *= Math.exp(-deltaMs / decelerationMs);
      state.current += state.velocity * (deltaMs / 1000);

      onUpdate?.(state.current, state.velocity);

      if (Math.abs(state.velocity) < precision) {
        state.velocity = 0;
        isCoasting = false;
        ticker.remove(update);
        onTicker = false;
        onEnded?.();
      }
    } else {
      // Tracking — just report position
      onUpdate?.(state.current, state.velocity);
    }
  }

  return {
    track: (position: number) => {
      if (!onTicker) {
        ticker.add(update);
        onTicker = true;
      }
      if (lastPosition !== undefined && lastFrameTime > 0) {
        const dt = performance.now() - lastFrameTime;
        state.velocity = ((position - lastPosition) / Math.max(dt, 1)) * 1000;
      }
      lastPosition = position;
      lastFrameTime = performance.now();
      state.current = position;
      isCoasting = false;
    },
    release: () => {
      isCoasting = true;
      lastPosition = undefined;
      if (!onTicker) {
        ticker.add(update);
        onTicker = true;
      }
    },
    setValue: (value: number) => {
      state.current = value;
      state.velocity = 0;
      lastPosition = undefined;
      isCoasting = false;
      if (onTicker) {
        ticker.remove(update);
        onTicker = false;
      }
    },
    get value() {
      return state.current;
    },
    get velocity() {
      return state.velocity;
    },
    get status(): InterpolationStatus {
      return onTicker || isCoasting ? "active" : "inactive";
    },
  };
};
