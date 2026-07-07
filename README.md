<h1 align="center">anim-engine</h1>

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/anim-engine.svg)](https://www.npmjs.com/package/anim-engine)
[![License](https://img.shields.io/npm/l/anim-engine.svg)](https://github.com/LukeCarlThompson/anim-engine/blob/main/packages/anim-engine/LICENSE)
[![CI](https://github.com/LukeCarlThompson/anim-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/LukeCarlThompson/anim-engine/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)

</div>

**Renderer-agnostic animation for JavaScript runtimes.** A fast, lightweight, pure-numeric animation engine.

- [Getting started](#getting-started)
- [Design](#design)
- [Key advantages](#key-advantages)
- [Primitives](#primitives)
- [Usage](#usage)
  - [createAnimation (tween)](#createanimation)
  - [createAnimation (keyframes)](#keyframes)
  - [Re-playing and sequencing](#re-playing-and-sequencing)
  - [createTimeline](#createtimeline)
  - [Continuous primitives](#continuous-primitives)
  - [createSmoothClamp](#createsmoothclamp)
  - [Color](#color)
- [Ticker](#ticker)
- [Easing](#easing)
- [Dynamic values](#dynamic-values)
- [Benchmarks](#benchmarks)
- [Game engine integration](#game-engine-integration)
- [API Reference](#api-reference)
- [License](#license)

## Getting started

```sh
npm install anim-engine
```

ESM only. Tree-shakeable — import only what you use.

```ts
import { createAnimation, getTicker } from "anim-engine";

// The ticker drives all animations. Start it once or drive it with an external ticker.
getTicker().start();

const anim = createAnimation({
  from: 0,
  to: 100,
  durationMs: 1000,
  ease: "outCubic",
  onUpdate: (value) => (sprite.x = value),
});

await anim.play();
```

## Design

Anim Engine is built around the same animation concepts used in animation applications.

- **Animation** — a timed tween from value A to value B with easing and delay. For simple A to B animations.
- **Keyframes** — multi-segment animation that describes a value at specific points in time and the easing used to transition between them. For longer more dynamic sequences.
- **Timeline** — orchestration of multiple keyframe animation layers running in parallel, sequence, or staggered offset. For complex layered animations of multiple values in sync.

With a some dynamic interpolation functions included for interactive behaviours.

- **createLerp** - a basic linear interpolation function.
- **createSmoothDamp** - a smoothed interpolation function.
- **createSpring** - a spring physics function.
- **createSmoothClamp** - a smoothed clamp function for natural range limits.

As well as a colour interpolation helper you can compose into any of the animation functions for smooth colour transitions.

- **lerpRgba** - interpolates between two RGBA colour arrays.
- **hexToRgba** - convert a hxe colour to an RGBA array.

### Deliberately decoupled.

Anim Engine works strictly with numbers so it remains decoupled from any renderer. This keeps it lean, fast and versatile.

Each function accepts an `onUpdate` callback that provides the latest value and velocity so you can assign it to an DOM element, WebGL object or any other target.

As well as exposing readonly properties for the `value` and `velocity` so they can be read inside a game loop.

## Key advantages

|                              |                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ⚡ **Fast**                  | 1.7–7.5× faster than GSAP overall; 3.0–6.2× when comparing equivalent `onUpdate` callback dispatch (see [benchmarks](#benchmarks)). |
| 🪶 **Lightweight**           | Tree-shakeable ESM — import only what you use. No DOM, no canvas, no dependencies.                                                  |
| 🎯 **Numbers only**          | A single numeric type for all values. No strings, no transforms, no branches. Predictable performance.                              |
| 🔌 **Renderer-agnostic**     | Feed values to PixiJS, ThreeJS, DOM, canvas2d, or WebGL. Same API everywhere.                                                       |
| 🧩 **Composable models**     | Animations, keyframes, and timelines compose cleanly — put tweens inside timelines, nest keyframes anywhere.                        |
| 🔄 **Continuous primitives** | Spring, smooth damp, and lerp chase live targets with zero setup — pass `() => value` for dynamic targets.                          |
| 🚫 **No GC pressure**        | Zero object allocations in hot update paths. State is mutated in place.                                                             |
| 🎨 **Perceptual color**      | Oklab interpolation via `lerpRgba` — no muddy browns. Compose it into any `onUpdate`.                                               |
| 📐 **TypeScript-first**      | Full type exports, exhaustive discriminated unions, no `any`.                                                                       |
| 🔧 **Ticker control**        | Bring your own game loop or use the built-in rAF ticker. Explicit — never auto-starts.                                              |

## Primitives

## `createAnimation`

### Usage

Animate a single value from `from` to `to` over `durationMs`.

```ts
import { createAnimation } from "anim-engine";

const anim = createAnimation({
  from: 0, // dynamic value
  to: 100, // dynamic value
  durationMs: 2000, // dynamic value
  ease: "outElastic",
  onStarted: () => console.log("started"),
  onUpdate: (value, velocity) => {
    sprite.x = value;
  },
  onProgress: (progress) => {
    console.log(progress); // 0 - 1 range
  },
  onEnded: () => console.log("done"),
  ticker: externalTicker, // Only required if you want an external ticker for this specific animation. Most common use case is wrapping in a library the provides it's own ticker.
});

// Promise-based control
await anim.play(); // plays, resolves when done
//...
anim.value; // the current value
anim.velocity; // the current velocity
anim.progress; // 0 - 1 range of the current progress
anim.pause(); // pauses in current position, suspends the promise
anim.setProgress(0.5); // sets the current progress in 0 - 1 range
anim.status; // the current animation status 'dead', 'playing', 'paused, 'stopped'
anim.durationMs; // the duration of the whole animation
anim.resume(); // resumes from paused position
anim.stop(); // resets to start and resolves promise
anim.skipToEnd(); // jumps to end, resolves promise
```

## `createAnimation` with keyframes

Multi-segment animation with per-keyframe easing.

The first keyframe is the starting point. Each subsequent keyframe specifies the gap in milliseconds from the previous one and an optional easing. Total duration is the sum of all gaps.

If no `ease` is specified on a keyframe, `"inOutSine"` is used as the default.

```ts
import { createAnimation } from "anim-engine";

const anim = createAnimation({
  keyframes: [
    { value: 0 }, // dynamic values () => number can be used but are evaluated on each play and cached until played again.
    { value: 50, gap: 300, ease: "outCubic" },
    { value: 80, gap: 400, ease: "inOutQuad" },
    { value: 100, gap: 300, ease: "outQuad" },
  ],
  onStarted: () => console.log("started"),
  onUpdate: (value, velocity) => {
    sprite.x = value;
  },
  onProgress: (progress) => {
    console.log(progress); // 0 - 1 range
  },
  onEnded: () => console.log("done"),
  ticker: externalTicker, // Only required if you want an external ticker for this specific animation. Most common use case is wrapping in a library the provides it's own ticker.
});

// Promise-based control
await anim.play(); // plays, resolves when done
//...
anim.value; // the current value
anim.velocity; // the current velocity
anim.progress; // 0 - 1 range of the current progress
anim.pause(); // pauses in current position, suspends the promise
anim.setProgress(0.5); // sets the current progress in 0 - 1 range
anim.status; // the current animation status 'dead', 'playing', 'paused, 'stopped'
anim.resume(); // resumes from paused position
anim.durationMs; // the total duration of the whole animation
anim.stop(); // resets to start and resolves promise
anim.skipToEnd(); // jumps to end, resolves promise
```

### Re-playing and sequencing

Since `play()` can be called again after a tween completes, repeat and yoyo patterns are built from the public API rather than baked into the engine:

```ts
import { createAnimation } from "anim-engine";

const anim = createAnimation({
  from: 1,
  to: 1.3,
  durationMs: 600,
  ease: "inOutSine",
  onUpdate: (scale) => sprite.scale.set(scale),
});

// Repeat — just call play() again
for (let i = 0; i < 3; i++) {
  await anim.play();
}

// Yoyo — swap from/to via dynamic accessors and re-play
let forward = true;
const bounce = createAnimation({
  from: () => (forward ? 1 : 1.3),
  to: () => (forward ? 1.3 : 1),
  durationMs: 600,
  ease: "inOutSine",
  onUpdate: (v) => sprite.scale.set(v),
});

for (let i = 0; i < 6; i++) {
  forward = !forward;
  await bounce.play();
}
```

## `createTimeline` for more complex layered sequences

```ts
import { createTimeline } from "anim-engine";

const timeline = createTimeline(
  [
    // at can be used for specific ms positioning
    { at: 0, animation: { keyframes: [{ value: 0 }, { value: 1, gap: 300 }] } },
    // or gap with wait the number of ms after or before the previous layer finishes, use negative values for before.
    { gap: 100, animation: { keyframes: [{ value: 1 }, { value: 0, gap: 300 }] } },
  ],
  {
    onStarted: () => console.log("started"),
    onUpdate: (values, velocities) => {
      console.log(`layer 1 value: ${values[0]}`);
      console.log(`layer 1 velocity: ${velocities[0]}`);
      console.log(`layer 2 value: ${values[1]}`);
      console.log(`layer 2 velocity: ${velocities[1]}`);
    },
    onProgress: (progress) => {
      console.log(progress); // 0 - 1 range of the whole timeline
    },
    onEnded: () => console.log("done"),
    ticker: externalTicker, // Only required if you want an external ticker for this specific animation. Most common use case is wrapping in a library the provides it's own ticker.
  },
);

// Promise-based control
await anim.play(); // plays, resolves when done
//...
anim.values: number[]; // the current values
anim.velocities: number[]; // the current velocities
anim.progress; // 0 - 1 range of the current progress
anim.pause(); // pauses in current position, suspends the promise
anim.setProgress(0.5); // sets the current progress in 0 - 1 range
anim.status; // the current animation status 'dead', 'playing', 'paused, 'stopped'
anim.durationMs; // the total duration of the whole timeline
anim.resume(); // resumes from paused position
anim.stop(); // resets to start and resolves promise
anim.skipToEnd(); // jumps to end, resolves promise
```

Compose multiple keyframe animations on a shared timeline with `at` or `gap` positions. Parallelism comes from multiple layers at the same or staggered `at` values.

```ts
import { createTimeline } from "anim-engine";

const timeline = createTimeline(
  [
    {
      at: 0,
      animation: {
        // each animation entry takes the same props as our `createAnimation` functions so we can listen for updates in callbacks to each single animation.
        keyframes: [{ value: 0 }, { value: 1, gap: 500 }],
        onUpdate: (v) => (sprite.alpha = v),
      },
    },
    {
      at: 0,
      animation: {
        keyframes: [{ value: -100 }, { value: 0, gap: 800, ease: "outBack" }],
        onUpdate: (v) => (sprite.x = v),
      },
    },
  ],
  {
    onProgress: (progress) => console.log(`overall: ${progress}`),
  },
);
```

## Continuous primitives

Spring, smooth damp, and lerp are **continuous** — they auto-start and chase a target.

### `createSpring`

```ts
import { createSpring } from "anim-engine";

const spring = createSpring({
  to: () => 100,
  stiffness: 180,
  damping: 12,
  mass: 1,
  precision: 0.01,
  onUpdate: (value, velocity) => {
    sprite.x = value;
  },
});

spring.setValue(0); // jump to start — spring chases back to 100

// Dynamic target — mouse chase
const targetX = { value: 0 };
document.addEventListener("mousemove", (e) => {
  targetX.value = e.clientX;
});

const follower = createSpring({
  to: () => targetX.value, // re-read every frame
  stiffness: 200,
  damping: 15,
  onUpdate: (v) => (sprite.x = v),
});
```

All parameters (`stiffness`, `damping`, `mass`, `to`) accept `number | (() => number)` — resolved every frame.

**Returns:** `Interpolation` — `start()`, `stop()`, `kill()`, `setValue(value)`, `velocity`, `velocity`, `status`. Starts at the `to()` value. Use `setValue(value)` to jump elsewhere.

#### createSmoothDamp

```ts
import { createSmoothDamp } from "anim-engine";

const damp = createSmoothDamp({
  to: () => 100,
  smoothTimeMs: 300,
  maxSpeed: Infinity,
  onUpdate: (value, velocity) => (sprite.x = value),
});

damp.setValue(0); // jump to start — damp chases back to 100
```

Unity-style smooth damp with Taylor-series exponential approximation. No stiffness/damping/mass to tune — just `smoothTimeMs` (milliseconds to reach target).

**Returns:** `Interpolation`

#### createLerp

```ts
import { createLerp } from "anim-engine";

const lerp = createLerp({
  to: () => 100,
  smoothTimeMs: 300, // ms to reach target
  onUpdate: (value, velocity) => (sprite.x = value),
});

lerp.setValue(0); // jump to start — lerp chases back to 100
```

First-order exponential approach: `value += (target - value) * rate * deltaTime`. `smoothTimeMs` is the approximate time in milliseconds to reach the target. Frame-rate independent.

**Returns:** `Interpolation`

### createSmoothClamp

```ts
import { createSmoothClamp } from "anim-engine";

const clamp = createSmoothClamp(45); // threshold = 45 units/s

const result = clamp(1000); // → ~44.96 (approaches 45 asymptotically)
const result2 = clamp(-500); // → ~-44.96 (symmetric)
```

Uses `threshold * (normalized / (1 + |normalized|))` for asymptotic saturation. Handles `Infinity` correctly. Returns a function `(value: number) => number` with a `setValue(0)` method to reset position.

### Color

Perceptually uniform Oklab interpolation. Straight RGB lerp produces muddy transitions — red→green goes through brown, blue→yellow goes through grey. Oklab matches human perception: equal steps look like equal changes.

```ts
import { lerpRgba, hexToRgba } from "anim-engine";

hexToRgba("#ff6b6b"); // → [1, 0.42, 0.42, 1]
hexToRgba("#f80"); // → [1, 0.533, 0, 1] (shorthand)
hexToRgba("#ff804080"); // → [1, 0.502, 0.251, 0.502] (with alpha)

const fromColor = hexToRgba("#ff6b6b");
const toColor = hexToRgba("#4ecdc4");

createAnimation({
  from: 0,
  to: 1,
  durationMs: 2000,
  ease: "outCubic",
  onUpdate: (t) => {
    const [r, g, b, a] = lerpRgba(fromColor, toColor, t);
    sprite.setColor(r, g, b, a);
  },
});
```

**With continuous primitives** — drive the blend factor via spring, damp, or lerp:

```ts
import { createSpring, lerpRgba, hexToRgba } from "anim-engine";

const fromColor = hexToRgba("#ff6b6b");
const toColor = hexToRgba("#4ecdc4");

const spring = createSpring({
  from: 0,
  to: () => (isHovered ? 1 : 0),
  stiffness: 180,
  damping: 12,
  onUpdate: (t) => {
    const [r, g, b] = lerpRgba(fromColor, toColor, t);
    sprite.setColor(r, g, b, 1);
  },
});
```

See [`src/color/README.md`](src/color/README.md) for the full Oklab reference including color-space internals.

## Ticker

The ticker does **not** auto-start. You must explicitly call `start()` (for rAF) or `update(deltaMs)` (for custom game loops) to drive animations.

Primitives register themselves with the ticker on creation — no manual registration needed.

**Standalone (rAF):** `getTicker().start()` uses its own `requestAnimationFrame` loop. Best for DOM-based demos or when you don't have a game loop.

```ts
import { getTicker, createAnimation } from "anim-engine";

getTicker().start(); // starts the rAF loop — call once

createAnimation({
  from: 0,
  to: 100,
  durationMs: 2000,
  ease: "outElastic",
  onUpdate: (v) => (sprite.x = v),
}).play();
```

**Custom game loop:** Call `getTicker().update(deltaMs)` from your own loop. Syncs to PixiJS ticker, ThreeJS `requestAnimationFrame`, or a fixed-step physics loop.

```ts
import { getTicker } from "anim-engine";

const animEngineTicker = getTicker();

// Call once per frame from your game loop
function gameLoop(deltaMs: number) {
  animEngineTicker.update(deltaMs);
  // ... physics, rendering
}
```

**Stop:** Call `getTicker().stop()` or `animEngineTicker.stop()` to clean up the rAF loop.

## Easing

31 Penner easing functions plus custom cubic bezier:

```ts
import { cubicBezier, EASE_NAMES } from "anim-engine";

const customEase = cubicBezier(0.25, 0.1, 0.25, 1); // custom easing function

// Use it anywhere you'd use an ease name
const anim = createAnimation({
  from: 0,
  to: 100,
  durationMs: 1000,
  ease: customEase,
  onUpdate: (v) => (sprite.x = v),
});
```

You can pass the result directly to any `ease` option — it's an `EaseFunction`, just like the named presets.

**Supported ease names:** `linear`, `inQuad`, `outQuad`, `inOutQuad`, `inCubic`, `outCubic`, `inOutCubic`, `inQuart`, `outQuart`, `inOutQuart`, `inQuint`, `outQuint`, `inOutQuint`, `inSine`, `outSine`, `inOutSine`, `inExpo`, `outExpo`, `inOutExpo`, `inCirc`, `outCirc`, `inOutCirc`, `inBack`, `outBack`, `inOutBack`, `inElastic`, `outElastic`, `inOutElastic`, `inBounce`, `outBounce`, `inOutBounce`.

## Dynamic values

The `DynamicValue` type (`number | (() => number)`) lets you provide values that are resolved at runtime. How often they're resolved depends on the primitive:

### Timed animations (per-play)

In `createAnimation` — tweens and keyframes — all dynamic values are resolved **once when `play()` is called** and cached for the duration of that run. The frame-hot update path reads from the cache with zero overhead:

```ts
const anim = createAnimation({
  from: () => getLayoutStart(),
  to: () => getLayoutEnd(),
  durationMs: () => 500 / speedMultiplier,
  keyframes: [
    { at: 0, value: 0 },
    { at: () => scrollHeight * 0.3, value: 50 },
    { at: () => scrollHeight, value: 100 },
  ],
});

// Values resolved here, cached for duration
await anim.play();

// On re-play, values are re-resolved
await anim.play();
```

This means `from`, `to`, `durationMs`, `keyframe.at`, and `keyframe.value` are all evaluated at play time and remain stable throughout the animation. If you need truly per-frame dynamic values, that's the domain of continuous primitives.

### Continuous primitives (per-frame)

In `createSpring`, `createSmoothDamp`, and `createLerp`, dynamic values are resolved **every frame** — these primitives are designed to chase live targets:

```ts
const spring = createSpring({
  to: () => getMousePosition(), // re-read every frame
  stiffness: () => sliderValue, // dynamic stiffness
  damping: () => dampingValue,
});
```

This distinction reflects the two use-cases: timed animations describe a fixed motion path evaluated at start, while continuous primitives describe ongoing behaviour that adapts to changing input.

## Benchmarks

Performance comparison against GSAP (vitest bench, Apple Silicon M-series, Node 24). All easing functions are matched between libraries.

### vs GSAP internal mutation

GSAP defaults to mutating target properties directly. This is faster than dispatching callbacks but couples GSAP to the mutation pattern. Anim-engine always dispatches via `onUpdate` (renderer-agnostic).

| Benchmark                                     | anim-engine  | GSAP         | Ratio       |
| --------------------------------------------- | ------------ | ------------ | ----------- |
| **Single tween** (cubic, 1000 frames)         | 40,814 ops/s | 10,776 ops/s | 3.8× faster |
| **Single tween** (linear, 1000 frames)        | 28,590 ops/s | 14,499 ops/s | 2.0× faster |
| **Single tween** (cubic bezier, 1000 frames)  | 21,449 ops/s | 12,637 ops/s | 1.7× faster |
| **Keyframe** (3 segments, 1000 frames)        | 26,741 ops/s | 3,549 ops/s  | 7.5× faster |
| **50 concurrent tweens** (500 frames)         | 892 ops/s    | 438 ops/s    | 2.0× faster |
| **200 concurrent tweens** (500 frames)        | 200 ops/s    | 106 ops/s    | 1.9× faster |
| **1000 concurrent tweens** (500 frames)       | 38 ops/s     | 22 ops/s     | 1.7× faster |
| **50 concurrent keyframes** (500 frames)      | 934 ops/s    | 174 ops/s    | 5.4× faster |
| **50-layer timeline** (staggered, 500 frames) | 710 ops/s    | 404 ops/s    | 1.8× faster |
| **50 tweens re-play** (2 cycles, 500 frames)  | 558 ops/s    | 128 ops/s    | 4.4× faster |

### vs GSAP onUpdate (fair comparison)

gsap also supports `onUpdate` callbacks, which is equivalent to anim-engine's renderer-agnostic model. This is the apples-to-apples comparison.

| Benchmark                              | anim-engine  | GSAP (onUpdate) | Ratio       |
| -------------------------------------- | ------------ | --------------- | ----------- |
| **Single tween** (cubic, 1000 frames)  | 40,814 ops/s | 6,618 ops/s     | 6.2× faster |
| **50 concurrent tweens** (500 frames)  | 892 ops/s    | 273 ops/s       | 3.3× faster |
| **200 concurrent tweens** (500 frames) | 200 ops/s    | 66 ops/s        | 3.0× faster |

Run locally: `npm run bench`

## Game engine integration

### PixiJS

```ts
import { Application, Sprite } from "pixi.js";
import { createAnimation, getTicker } from "anim-engine";

const app = new Application();
await app.init({ width: 800, height: 600 });

const sprite = Sprite.from("texture.png");
app.stage.addChild(sprite);

// Sync anim-engine ticker to PixiJS ticker
const animEngineTicker = getTicker();
app.ticker.add((delta) => {
  animEngineTicker.update(delta.deltaMS);
});

createAnimation({
  from: 0,
  to: 300,
  durationMs: 2000,
  ease: "outElastic",
  onUpdate: (x) => (sprite.x = x),
}).play();
```

### ThreeJS

```ts
import * as THREE from "three";
import { createAnimation, getTicker, createSmoothDamp } from "anim-engine";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: "#667eea" }),
);
scene.add(mesh);

const animEngineTicker = getTicker();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  animEngineTicker.update(clock.getDelta() * 1000);
  renderer.render(scene, camera);
}
animate();

createAnimation({
  from: 0,
  to: Math.PI * 2,
  durationMs: 3000,
  ease: "inOutCubic",
  onUpdate: (angle) => (mesh.rotation.y = angle),
}).play();
```

### Custom game loop

```ts
import { getTicker, createSpring } from "anim-engine";

const animEngineTicker = getTicker();

function gameLoop(timestamp: number) {
  const deltaMs = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  animEngineTicker.update(deltaMs);
  // ... physics, rendering, etc.

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

## API Reference

### Functions

| Export                             | Description                         |
| ---------------------------------- | ----------------------------------- |
| `createAnimation(options)`         | Timed or keyframe animation         |
| `createTimeline(layers, options?)` | Composited timeline of animations   |
| `createSpring(options)`            | Physics spring (Verlet integration) |
| `createSmoothDamp(options)`        | Unity-style smooth damp             |
| `createLerp(options)`              | Exponential lerp chase              |
| `createSmoothClamp(threshold)`     | Asymptotic clamp factory            |
| `getTicker()`                      | Singleton ticker                    |
| `cubicBezier(p1x, p1y, p2x, p2y)`  | Custom cubic bezier easing          |
| `lerpRgba(from, to, t)`            | Oklab color interpolation           |
| `hexToRgba(hex)`                   | Parse hex color to normalized RGBA  |

### Type exports

| Type                       | Description                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Animation`                | `play`, `pause`, `resume`, `stop`, `skipToEnd`, `kill`, `setProgress`, `velocity`, `velocity`, `progress`, `status` |
| `Interpolation`            | `start`, `stop`, `kill`, `setValue`, `velocity`, `velocity`, `status`                                               |
| `Timeline`                 | `play`, `pause`, `resume`, `stop`, `skipToEnd`, `kill`, `setProgress`, `progress`, `status`                         |
| `EaseName`                 | Union of 31 ease name strings                                                                                       |
| `EaseFunction`             | `(t: number) => number`                                                                                             |
| `DynamicValue`             | `number \| (() => number)`                                                                                          |
| `AnimationStatus`          | `"playing" \| "paused" \| "stopped" \| "dead"` (for `Animation` / `Timeline`)                                       |
| `InterpolationStatus`      | `"active" \| "inactive" \| "dead"` (for `Interpolation`)                                                            |
| `AnimationOptions`         | Single tween or keyframe animation options (discriminated union)                                                    |
| `Keyframe`                 | `{ value, gap?, ease? }`                                                                                            |
| `KeyframeAnimationOptions` | `{ keyframes: Keyframe[], onStarted?, onUpdate?, onProgress?, onEnded? }`                                           |
| `TimelineLayer`            | `{ animation: KeyframeAnimationOptions; at: DynamicValue } \| { animation: KeyframeAnimationOptions; gap: number }` |
| `SpringOptions`            | `to`, `stiffness`, `damping`, `mass`, `precision?`, `onUpdate`, `onEnded`                                           |
| `SmoothDampOptions`        | `to`, `smoothTimeMs`, `maxSpeed?`, `precision?`, `onUpdate`, `onEnded`                                              |
| `LerpOptions`              | `to`, `smoothTimeMs`, `precision?`, `onUpdate`, `onEnded`                                                           |
| `RgbaTuple`                | `readonly [number, number, number, number]`                                                                         |
| `Ticker`                   | `start`, `stop`, `update`, `add`, `remove`                                                                          |

## License

MIT
