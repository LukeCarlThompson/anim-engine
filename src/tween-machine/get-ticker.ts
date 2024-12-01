import type { Ticker } from "./tween-machine";
import { TickerInternal } from "./ticker-implementation";

let ticker: Ticker | undefined = undefined;

export const getTicker = (): Ticker => {
  if (ticker) return ticker;

  ticker = new TickerInternal();

  return ticker;
};
