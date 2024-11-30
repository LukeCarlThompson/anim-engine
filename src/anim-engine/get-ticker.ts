import { Ticker } from "./ticker-implementation";
import type { TickerApi } from "./anim-engine";

let ticker: Ticker | undefined = undefined;

export const getTicker = (): TickerApi => {
  if (ticker) return ticker;

  ticker = new Ticker();

  return ticker;
};
