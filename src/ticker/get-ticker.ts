import type { Ticker } from "./ticker";
import { createTicker } from "./ticker";

let singleton: Ticker | undefined;

/** Returns the default ticker singleton. Created lazily on first access. */
export const getTicker = (): Ticker => {
  if (!singleton) {
    singleton = createTicker();
  }
  return singleton;
};

/** Creates a new independent ticker instance (for testing or multi-loop setups). */
export { createTicker } from "./ticker";
