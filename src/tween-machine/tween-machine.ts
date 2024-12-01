export type EaseName =
  | "linear"
  | "inQuad"
  | "outQuad"
  | "inOutQuad"
  | "inCubic"
  | "outCubic"
  | "inOutCubic"
  | "inQuart"
  | "outQuart"
  | "inOutQuart"
  | "inQuint"
  | "outQuint"
  | "inOutQuint"
  | "inSine"
  | "outSine"
  | "inOutSine"
  | "inExpo"
  | "outExpo"
  | "inOutExpo"
  | "inCirc"
  | "outCirc"
  | "inOutCirc"
  | "inBack"
  | "outBack"
  | "inOutBack"
  | "inElastic"
  | "outElastic"
  | "inOutElastic"
  | "inBounce"
  | "outBounce"
  | "inOutBounce";

export type PickByType<T, Value> = {
  [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P];
};

export type TweenTarget = Record<string | number | symbol, unknown>;

export type TweenOptions<Target extends TweenTarget = TweenTarget> = {
  to: PickByType<Target, number>;
  durationMs?: number;
  ease?: EaseName;
  onStarted?: (currentValue: PickByType<Target, number>) => void;
  onUpdate?: (currentValue: PickByType<Target, number>, velocity: PickByType<Target, number>) => void;
  onEnded?: (currentValue: PickByType<Target, number>) => void;
};

export type Tween = {
  play(): Promise<void>;
  update(deltaMs: number): void;
  pause(): void;
  resume(): void;
  stop(): void;
  skipToEnd(): void;
  kill(): void;
};

export type Ticker = {
  start(): void;
  stop(): void;
  set autoStart(autoStart: boolean);
  update(now: number): void;
};
