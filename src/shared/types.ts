// === Shared Types ===

export type EaseName =
  | "linear"
  | "inQuad" | "outQuad" | "inOutQuad"
  | "inCubic" | "outCubic" | "inOutCubic"
  | "inQuart" | "outQuart" | "inOutQuart"
  | "inQuint" | "outQuint" | "inOutQuint"
  | "inSine" | "outSine" | "inOutSine"
  | "inExpo" | "outExpo" | "inOutExpo"
  | "inCirc" | "outCirc" | "inOutCirc"
  | "inBack" | "outBack" | "inOutBack"
  | "inElastic" | "outElastic" | "inOutElastic"
  | "inBounce" | "outBounce" | "inOutBounce";

export type EaseFunction = (t: number) => number;

export type Status = "playing" | "paused" | "stopped" | "dead";

export type DynamicValue<T> = T | (() => T);

// === AnimControls (tween, timeline, spring) ===

export type AnimControls<T> = {
  play: () => Promise<AnimControls<T>>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipToEnd: () => void;
  kill: () => void;

  from: DynamicValue<T>;
  to: DynamicValue<T>;
  ease: EaseName | EaseFunction;
  setCurrent: (value: T) => void;

  currentValue: T;
  velocity: T;
  progress: number;
  status: Status;
  getDurationMs: () => number;
};

// === ContinuousControls (smooth damp, lerp) ===

export type ContinuousControls<T> = {
  start: () => void;
  stop: () => void;
  kill: () => void;

  setCurrent: (value: T) => void;

  currentValue: T;
  velocity: T;
  status: "active" | "inactive" | "dead";
};

// === SingleTweenOptions (from/to mode) ===

export type SingleTweenOptions = {
  from?: DynamicValue<number>;
  to: DynamicValue<number>;
  durationMs?: number;
  ease?: EaseName | EaseFunction;
  delayMs?: number;
  repeat?: number;
  yoyo?: boolean;
  onStarted?: (value: number) => void;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: (value: number) => void;
  onRepeat?: (value: number) => void;
};

// === KeyframeOptions (keyframe mode) ===

export type Keyframe = {
  at: number;
  value: DynamicValue<number>;
  ease?: EaseName | EaseFunction;
};

export type KeyframeOptions = {
  keyframes: Keyframe[];
  onUpdate?: (value: number, velocity: number) => void;
  onProgress?: (progress: number) => void;
  onEnded?: (value: number) => void;
};

// === AnimateOptions — union of both modes ===

export type AnimateOptions = SingleTweenOptions | KeyframeOptions;

// === SpringOptions ===

export type SpringOptions = {
  from?: DynamicValue<number>;
  to: DynamicValue<number>;
  stiffness?: DynamicValue<number>;
  damping?: DynamicValue<number>;
  mass?: DynamicValue<number>;
  precision?: number;
  onStarted?: (value: number) => void;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: (value: number) => void;
};

// === SmoothDampOptions ===

export type SmoothDampOptions = {
  from: () => number;
  to: () => number;
  smoothTime: DynamicValue<number>;
  maxSpeed?: DynamicValue<number>;
  onUpdate: (value: number, velocity: number) => void;
};

// === LerpOptions ===

export type LerpOptions = {
  from: () => number;
  to: () => number;
  rate: DynamicValue<number>;
  onUpdate: (value: number) => void;
};

// === Timeline ===

export type TimelineKeyframe = {
  at?: number;
  gap?: number;
  animations: AnimControls<number>[];
};

export type TimelineOptions = {
  keyframes: TimelineKeyframe[];
  onStarted?: () => void;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
};

export type TimelineHandle = {
  play: () => Promise<TimelineHandle>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipToEnd: () => void;
  kill: () => void;
  progress: number;
  status: "playing" | "paused" | "stopped" | "dead";
  getDurationMs: () => number;
};

// === TickerControls ===

export type TickerControls = {
  start: () => void;
  stop: () => void;
  update: (deltaMs: number) => void;
  add: (anim: { update: (deltaMs: number) => void }) => void;
  remove: (anim: { update: (deltaMs: number) => void }) => void;
};
