// Anim Engine — Public API

export { createAnimation } from "./animation";
export { createTimeline } from "./timeline";
export { createSpring } from "./spring";
export { createSmoothDamp } from "./smooth-damp";
export { createLerp } from "./lerp";
export { createSmoothClamp } from "./smooth-clamp";
export { lerpRgba, hexToRgba } from "./lerp-rgba";
export { getTicker } from "./ticker";
export { cubicBezier } from "./domain";

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
  LerpOptions,
  SmoothDampOptions,
  SpringOptions,
  RgbaTuple,
} from "./domain";
