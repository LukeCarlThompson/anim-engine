import { Ticker } from "./implementation/ticker";

let ticker: Ticker | undefined = undefined;

export const getTicker = (): Ticker => {
  if (ticker) return ticker;

  ticker = new Ticker();

  return ticker;
};
