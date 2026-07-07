export type TickHandler = (deltaMs: number) => void;

export type Ticker = {
  start: () => void;
  stop: () => void;
  update: (deltaMs: number) => void;
  add: (handler: TickHandler) => void;
  remove: (handler: TickHandler) => void;
};

export type ExternalTicker = {
  add: (handler: TickHandler) => void;
  remove: (handler: TickHandler) => void;
};
