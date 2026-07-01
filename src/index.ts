// Anim Engine — Public API

// Primitives
export { animate } from "./tween/create-tween";
export { createTimeline } from "./timeline/create-timeline";
export type { Timeline } from "./timeline/create-timeline";
// export { createSpring } from "./spring/create-spring";
// export { createSmoothDamp } from "./smooth-damp/create-smooth-damp";
// export { createLerp } from "./lerp/create-lerp";

// Ticker
export { getTicker, createTicker } from "./ticker/get-ticker";

// Easing
export { easingFunctions, EASE_NAMES, resolveEasing, cubicBezier } from "./easing/easing";

// Types
export type {
  AnimControls,
  AnimateOptions,
  ContinuousControls,
  EaseName,
  Keyframe,
  SingleTweenOptions,
  Status,
  TimelineHandle,
  TimelineOptions,
  TickerControls,
  SpringOptions,
  SmoothDampOptions,
  LerpOptions,
} from "./shared/types";
