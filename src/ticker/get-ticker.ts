import type { TickerControls } from "./ticker";
import { createTicker } from "./ticker";

let singleton: TickerControls | undefined;

/** Returns the default ticker singleton. Created lazily on first access. */
export const getTicker = (): TickerControls => {
  if (!singleton) {
    singleton = createTicker();
  }
  return singleton;
};

/** Creates a new independent ticker instance (for testing or multi-loop setups). */
export { createTicker } from "./ticker";
