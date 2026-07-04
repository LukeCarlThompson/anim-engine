// Anim Engine — Public API

// Primitives
export { createAnimation } from "./animation/create-animation";
export { createTimeline } from "./timeline/create-timeline";
export { createSpring } from "./spring/create-spring";
export { createSmoothDamp } from "./smooth-damp/create-smooth-damp";
export { createLerp } from "./lerp/create-lerp";
export { createSmoothClamp } from "./smooth-clamp/smooth-clamp";
export { lerpOklab, hexToRgba } from "./color/lerp-oklab";

// Ticker
export { getTicker } from "./ticker/get-ticker";

// Easing
export { easingFunctions, EASE_NAMES, cubicBezier } from "./easing/easing";

// Types
export type {
  SingleTweenOptions,
  Keyframe,
  KeyframeOptions,
  AnimationOptions,
} from "./animation/create-animation";
export type { Animation, Interpolation, EaseName, Status, DynamicValue } from "./shared/types";
export type { SpringOptions } from "./spring/create-spring";
export type { SmoothDampOptions } from "./smooth-damp/create-smooth-damp";
export type { LerpOptions } from "./lerp/create-lerp";
export type { TimelineLayer, Timeline } from "./timeline/create-timeline";
export type { RgbaTuple } from "./color/lerp-oklab";
export type { TickerControls } from "./ticker/ticker";
