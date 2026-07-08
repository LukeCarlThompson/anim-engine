import type { Interpolation, SpringOptions } from "../domain";
import { resolveValue } from "../domain/resolve-value";
import { getTicker } from "../ticker";
import { verletStep } from "./verlet";
import type { SpringState } from "./verlet";

/**
 * Creates a spring-based interpolation that simulates mass-spring-damper
 * physics, producing bouncy or elastic movement toward the target value.
 *
 * Uses Verlet integration for stable, energy-conserving simulation.
 * Higher stiffness produces faster, snappier motion; higher damping
 * reduces oscillation. The target is re-evaluated every frame.
 *
 * @param options - Configuration options for the spring interpolation.
 * @returns An {@link Interpolation} instance for controlling the spring.
 */
export const createSpring = ({
  precision = 0.01,
  onUpdate,
  onEnded,
  to: rawTo,
  stiffness: rawStiffness = 180,
  damping: rawDamping = 12,
  mass: rawMass = 1,
  ticker = getTicker(),
}: SpringOptions): Interpolation => {
  const state: SpringState = { current: rawTo(), velocity: 0 };
  let active = true;

  // Register immediately (auto-start)
  ticker.add(update);

  const resume = () => {
    if (active) return;
    active = true;
    ticker.add(update);
  };

  const stop = () => {
    active = false;
    ticker.remove(update);
  };

  function update(deltaMs: number) {
    if (!active) return;

    const target = rawTo();
    const stiffness = resolveValue(rawStiffness);
    const damping = resolveValue(rawDamping);
    const mass = resolveValue(rawMass);
    verletStep(state, target, stiffness, damping, mass, deltaMs);

    onUpdate?.(state.current, state.velocity);

    // Fire onEnded when settled, but keep spring alive for target changes
    if (
      onEnded &&
      Math.abs(state.current - target) < precision &&
      Math.abs(state.velocity) < precision
    ) {
      state.current = target;
      state.velocity = 0;
      onEnded();
    }
  }

  const controls: Interpolation = {
    resume,
    stop,
    setValue: (value: number) => {
      state.current = value;
      state.velocity = 0;
    },
    get value() {
      return state.current;
    },
    get velocity() {
      return state.velocity;
    },
    get status() {
      return active ? "active" : "inactive";
    },
  };

  return controls;
};
