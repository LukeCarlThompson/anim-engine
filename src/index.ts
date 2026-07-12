// Anim Engine — Public API

export { createAnimation } from "./animation";
export { createTimeline } from "./timeline";
export { createLerp } from "./lerp";
export { createSmoothDamp } from "./smooth-damp";
export { createSmoothClamp } from "./smooth-clamp";
export { createSpring } from "./spring";
export { createInertia } from "./inertia";
export { createSmoothScroll } from "./smooth-scroll";
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
  ExternalTicker,
  Inertia,
  InertiaOptions,
  SmoothScroll,
  SmoothScrollOptions,
} from "./domain";
