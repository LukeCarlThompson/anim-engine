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
  pause(): void;
  resume(): void;
  stop(): void;
  skipToEnd(): void;
  kill(): void;
  get progress(): number;
  set progress(progress: number);
};

export type TweenSequenceStep<Target extends TweenTarget> = {
  to: Target;
  durationMs?: number;
  ease?: EaseName;
};

export type TweenSequenceOptions<Target extends TweenTarget> = {
  onStarted?: (currentValue: PickByType<Target, number>) => void;
  onUpdate?: (currentValue: PickByType<Target, number>, velocity: PickByType<Target, number>) => void;
  onEnded?: (currentValue: PickByType<Target, number>) => void;
  steps: TweenSequenceStep<PickByType<Target, number>>[];
};

export type TweenSequence = Tween & {
  skipToEndOfCurrentStep(): void;
};

export type Ticker = {
  start(): void;
  stop(): void;
  set autoStart(autoStart: boolean);
  update(now: number): void;
};
