# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - Pre-release — API subject to change before 1.0.0.

### Added

- `Keyframe.onReached` — callback fired when a keyframe animation reaches a keyframe, after its value is written by `onUpdate` and before `onEnded`. It follows the same rules as `onEnded`: it fires during playback and for keyframes that remain when `skipToEnd()` finishes a playing animation, but it does not fire for a `setProgress()` seek. It is ignored on the first keyframe. A keyframe fires again if playback seeks backwards and crosses it forward again.

## [0.6.0] - Pre-release — API subject to change before 1.0.0.

- `createAnimation` — timed tween from A → B with easing, delay, and promise-based lifecycle. Also supports multi-segment keyframe mode (sequential by construction with `gap: DynamicValue`).
- `createTimeline` — orchestrates multiple keyframe animations on a shared timeline with `at`/`gap` positioning. Takes `KeyframeAnimationOptions` configs directly. Registers a single ticker handler regardless of layer count.
- `createSpring` — physics-based spring (Verlet integration, mass/stiffness/damping). Dynamic targets resolved per-frame.
- `createSmoothDamp` — Unity-style smooth damp chase with `smoothTimeMs` parameter.
- `createLerp` — first-order exponential chase, single rate parameter.
- `createSmoothClamp` — asymptotic clamp for capping velocity or force.
- `lerpRgba` / `hexToRgba` — perceptually uniform color interpolation via Oklab.
- `cubicBezier` — pre-computed lookup table custom bezier easing.
- 31 Penner easing functions (linear through bounce).
- `getTicker` — singleton ticker with rAF auto-loop and manual `update(deltaMs)` modes.
- `createInertia` - function added for drag and flick or style animations.
- `createSmoothScroll` - function added as a wrapper around `createSmoothDamp` to make implementing smooth scroll in canvas or webGL contexts easier.
