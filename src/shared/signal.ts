/**
 * Stop/skip signal for timed primitives.
 * A boolean flag at factory scope — shared between play() and stop().
 */
export const createSignal = (): { readonly stopped: boolean; stop: () => void; reset: () => void } => {
  let stopped = false;

  const stop = () => { stopped = true; };
  const reset = () => { stopped = false; };

  return { get stopped() { return stopped; }, stop, reset };
};
