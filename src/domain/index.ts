export type { AnimationStatus } from "./animation";
export type {
  InterpolationStatus,
  Interpolation,
  LerpOptions,
  SmoothDampOptions,
  SpringOptions,
  InertiaOptions,
  Inertia,
  SmoothScrollOptions,
  SmoothScroll,
} from "./interpolation";
export type { EaseName, EaseFunction } from "./easing";
export { EASE_NAMES, cubicBezier, EASING_FUNCTIONS, resolveEasing } from "./easing";
export type { Ticker, TickHandler, ExternalTicker } from "./ticker";
export { resolveValue } from "./resolve-value";
export type { DynamicValue } from "./resolve-value";

export type {
  Animation,
  AnimationOptions,
  SingleTweenOptions,
  KeyframeAnimationOptions,
  Keyframe,
} from "./animation";

export type { TimelineLayer, Timeline, TimelineCallbacks } from "./timeline";

export type { RgbaTuple, LerpRgba } from "./color";
