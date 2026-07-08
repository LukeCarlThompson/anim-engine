/**
 * A function that is called on each tick with the elapsed time in milliseconds.
 *
 * @param deltaMs - The time elapsed since the last tick in milliseconds.
 */
export type TickHandler = (deltaMs: number) => void;

/**
 * A ticker that drives frame updates. It manages a list of {@link TickHandler}
 * callbacks and distributes time updates to them on each frame.
 */
export type Ticker = {
  /** Starts the ticker, beginning to dispatch updates to registered handlers. */
  start: () => void;
  /** Stops the ticker, halting further dispatch of updates. */
  stop: () => void;
  /**
   * Manually advances the ticker by the given delta, dispatching to all
   * registered handlers.
   */
  update: (deltaMs: number) => void;
  /** Registers a handler to receive tick updates. */
  add: (handler: TickHandler) => void;
  /** Unregisters a previously registered handler. */
  remove: (handler: TickHandler) => void;
};

/**
 * A minimal ticker interface exposing only subscription capabilities.
 * Useful for external tickers (e.g. from a game loop or an animation
 * framework) where start/stop/update are managed externally.
 */
export type ExternalTicker = {
  /** Registers a handler to receive tick updates. */
  add: (handler: TickHandler) => void;
  /** Unregisters a previously registered handler. */
  remove: (handler: TickHandler) => void;
};
