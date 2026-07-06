// Anim Engine — Public API

export { createAnimation } from "./animation/create-animation";
export { createTimeline } from "./timeline/create-timeline";
export { createSpring } from "./spring/create-spring";
export { createSmoothDamp } from "./smooth-damp/create-smooth-damp";
export { createLerp } from "./lerp/create-lerp";
export { createSmoothClamp } from "./smooth-clamp/smooth-clamp";
export { lerpOklab, hexToRgba } from "./color/lerp-oklab";

export { getTicker, EASE_NAMES, cubicBezier } from "./domain";

export type {
  EaseName,
  Interpolation,
  AnimationStatus,
  InterpolationStatus,
  DynamicValue,
  Animation,
  Keyframe,
  AnimationOptions,
  KeyframeAnimationOptions,
  TimelineLayer,
  Timeline,
  Ticker,
} from "./domain";
export type { SpringOptions } from "./spring/create-spring";
export type { SmoothDampOptions } from "./smooth-damp/create-smooth-damp";
export type { LerpOptions } from "./lerp/create-lerp";
export type { RgbaTuple } from "./color/lerp-oklab";
