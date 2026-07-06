export type { AnimationStatus } from "./animation";
export type { InterpolationStatus, Interpolation } from "./interpolation";
export type { EaseName, EaseFunction } from "./easing";
export { EASE_NAMES, cubicBezier, EASING_FUNCTIONS, resolveEasing } from "./easing";
export { getTicker } from "./ticker";
export type { Ticker, TickHandler } from "./ticker";
export { resolveValue } from "./resolve-value";
export type { DynamicValue } from "./resolve-value";

export type {
  Animation,
  AnimationOptions,
  SingleTweenOptions,
  KeyframeAnimationOptions,
  Keyframe,
} from "./animation";

export type { TimelineLayer, Timeline } from "./timeline";
