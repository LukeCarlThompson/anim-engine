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

export type AnimEngineStatus = "playing" | "paused" | "stopped" | "dead";

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
  /**
   * Plays the animation from start to end.
   */
  play: () => Promise<AnimEngineApi>;
  /**
   * Pauses a playing animation at the current frame leaving the `play()` promise unresolved.
   * It can be resumed.
   */
  pause: () => void;
  /**
   * Resumes a paused animation.
   */
  resume: () => void;
  /**
   * Stops a playing animation at the current frame and resolves the `play()` promise.
   * It cannot be resumed but can be played again.
   */
  stop: () => void;
  /**
   * Stops an animation at the current frame and removes it from the ticker. If the animation is playing the `play()` promise will not be resolved. It cannot be played again or resumed.
   */
  kill: () => void;
  /**
   * Skips a playing animation to the end value immediately and resolves the `play()` promise.
   * The animation can be played again.
   */
  skipToEnd(): void;
  set from(from: NumberOrFunction);
  set to(to: NumberOrFunction);
  set ease(ease: EaseName);
  get velocity(): number;
  get progress(): number;
  set progress(progress: number);
  get status(): AnimEngineStatus;
  get currentValue(): number;
  get durationMs(): number;
};

export type AnimEngineSteps = [AnimEngineFirstStep, ...AnimEngineSubsequentStep[]];

export type AnimEngineFirstStep = {
  from: NumberOrFunction;
  to: NumberOrFunction;
  durationMs?: number;
  ease?: EaseName;
};

export type AnimEngineSubsequentStep = {
  from?: NumberOrFunction;
  to: NumberOrFunction;
  durationMs?: number;
  ease?: EaseName;
};

export type AnimEngineSequenceOptions = {
  repeat?: number;
  onStarted?: (currentValue: number) => void;
  onUpdate?: (currentValue: number, velocity: number) => void;
  onEnded?: (currentValue: number) => void;
  onRepeat?: (currentValue: number) => void;
  steps: AnimEngineSteps;
};

export type AnimEngineSequenceApi = {
  play(): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  kill(): void;
  skipToEndOfCurrentStep(): void;
  skipToEnd(): void;
  get velocity(): number;
  get progress(): number;
  set progress(progress: number);
  get status(): AnimEngineStatus;
  get currentValue(): number;
  get durationMs(): number;
};

export type TickerApi = {
  start(): void;
  stop(): void;
  set autoStart(autoStart: boolean);
  update(now: number): void;
};
