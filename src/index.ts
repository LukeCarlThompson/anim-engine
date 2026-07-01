// Anim Engine — Public API

// Primitives
export { animate } from "./tween/create-tween";
// export { createTimeline } from "./timeline/create-timeline";
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
  ContinuousControls,
  EaseName,
  Status,
  TweenOptions,
  SpringOptions,
  SmoothDampOptions,
  LerpOptions,
  TickerControls,
} from "./shared/types";
