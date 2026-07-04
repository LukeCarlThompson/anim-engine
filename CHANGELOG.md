# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - Pre-release — API subject to change before 1.0.0.

### Added

- `createAnimation` — timed tween from A → B with easing, delay, and promise-based lifecycle
- `createAnimation` (keyframe mode) — multi-segment value interpolation with per-keyframe easing
- `createTimeline` — orchestrate multiple animations with `at`/`gap` timing (parallel, sequential, overlapping)
- `createSpring` — physics-based spring (Verlet integration, mass/stiffness/damping)
- `createSmoothDamp` — Unity-style smooth damp chase with `smoothTimeMs` parameter
- `createLerp` — first-order exponential chase, single rate parameter
- `createSmoothClamp` — asymptotic clamp for capping velocity/force
- `lerpOklab` / `hexToRgba` — perceptually uniform color interpolation via Oklab
- `cubicBezier` — pre-computed lookup table custom bezier easing
- 31 Penner easing functions (linear through bounce)
- `getTicker` — singleton ticker with rAF auto-loop and manual `update(deltaMs)` modes
