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

export type AnimEngineStatus = "playing" | "paused" | "stopped" | "finished";

export type NumberOrFunction = number | (() => number);

export type AnimEngineOptions = {
  to: NumberOrFunction;
  from: NumberOrFunction;
  durationMs?: number;
  ease?: EaseName;
  repeat?: number;
  onStarted?: (currentValue: number) => void;
  onUpdate?: (currentValue: number, velocity: number) => void;
  onEnded?: (currentValue: number) => void;
  onRepeat?: (currentValue: number) => void;
};

export type CreateAnimEngine = (options: AnimEngineOptions) => AnimEngineApi;

export type AnimEngineApi = {
  set from(from: NumberOrFunction);
  set to(to: NumberOrFunction);
  set ease(ease: EaseName);
  play: () => Promise<AnimEngineApi>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  kill: () => void;
  get velocity(): number;
  get progress(): number;
  set progress(progress: number);
  get status(): AnimEngineStatus;
  get currentValue(): number;
};

export type TickerApi = {
  start(): void;
  stop(): void;
  set autoStart(autoStart: boolean);
  update(now: number): void;
};
