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
  onUpdate?: (currentValue: number) => void;
  onEnded?: (currentValue: number) => void;
  onRepeat?: (currentValue: number) => void;
};

export type CreateAnimEngine = (options: AnimEngineOptions) => AnimEngineApi;

export type AnimEngineApi = {
  set to(to: NumberOrFunction);
  set from(from: NumberOrFunction);
  play: () => Promise<AnimEngineApi>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  kill: () => void;
  get progress(): number;
  set progress(progress: number);
  get status(): AnimEngineStatus;
  get currentValue(): number;
};
