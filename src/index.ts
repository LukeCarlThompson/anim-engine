// Anim Engine — Public API

// Primitives
export { createAnimation } from "./animation/create-animation";
export { createTimeline } from "./timeline/create-timeline";
export type { Timeline } from "./timeline/create-timeline";
export { createSpring } from "./spring/create-spring";
export { createSmoothDamp } from "./smooth-damp/create-smooth-damp";
export { createLerp } from "./lerp/create-lerp";

// Ticker
export { getTicker, createTicker } from "./ticker/get-ticker";

// Easing
export { easingFunctions, EASE_NAMES, resolveEasing, cubicBezier } from "./easing/easing";

// Types
export type {
  AnimControls,
  ContinuousControls,
  EaseName,
  Status,
  DynamicValue,
} from "./shared/types";
export type {
  SingleTweenOptions,
  Keyframe,
  KeyframeOptions,
  AnimationOptions,
} from "./animation/create-animation";
export type { SpringOptions } from "./spring/create-spring";
export type { SmoothDampOptions } from "./smooth-damp/create-smooth-damp";
export type { LerpOptions } from "./lerp/create-lerp";
export type { TimelineKeyframe, TimelineOptions, TimelineHandle } from "./timeline/create-timeline";
export { createSmoothClamp } from "./smooth-clamp/smooth-clamp";
export type { TickerControls } from "./ticker/ticker";
