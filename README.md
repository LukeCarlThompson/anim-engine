# anim-engine

**Renderer-agnostic animation for JavaScript runtimes.** A fast, lightweight, pure-numeric animation engine.

- [Getting started](#getting-started)
- [Design](#design)
- [Key advantages](#key-advantages)
- [Primitives](#primitives)
- [Usage](#usage)
  - [createAnimation (tween)](#createanimation)
  - [createAnimation (keyframes)](#keyframes)
  - [Repeat & yoyo](#repeat--yoyo)
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

// The ticker drives all animations. Start it once.
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

Anim Engine is built around three simple mental models that compose naturally:

- **Animation** — a timed tween from value A to value B with easing, repeat, yoyo, and delay. The atomic unit of motion.
- **Keyframes** — multi-segment interpolation that describes what a single value does over time, with per-segment easing and millisecond timing.
- **Timeline** — orchestration of multiple animations running in parallel, sequence, or staggered offset. Composes tweens and keyframes.

Beyond timed animation, the engine provides **continuous primitives** — spring physics, smooth damp, and exponential lerp — for natural, target-chasing motion without a fixed duration.

### Why numbers only?

By restricting itself to numeric values, the engine eliminates string parsing, color-space branching, and transform-matrix overhead. You get a minimal surface area that is easy to optimise, tree-shake, reason about and fit into any renderer. Color interpolation (Oklab) is provided as a pure function — you compose it yourself into an `onUpdate` callback.

## Key advantages

|                              |                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ⚡ **Fast**                  | 1.7–9.9× faster than GSAP across tweens, keyframes, and concurrent animations (see [benchmarks](#benchmarks)). |
| 🪶 **Lightweight**           | Tree-shakeable ESM — import only what you use. No DOM, no canvas, no dependencies.                             |
| 🎯 **Numbers only**          | A single numeric type for all values. No strings, no transforms, no branches. Predictable performance.         |
| 🔌 **Renderer-agnostic**     | Feed values to PixiJS, ThreeJS, DOM, canvas2d, or WebGL. Same API everywhere.                                  |
| 🧩 **Composable models**     | Animations, keyframes, and timelines compose cleanly — put tweens inside timelines, nest keyframes anywhere.   |
| 🔄 **Continuous primitives** | Spring, smooth damp, and lerp chase live targets with zero setup — pass `() => value` for dynamic targets.     |
| 🚫 **No GC pressure**        | Zero object allocations in hot update paths. State is mutated in place.                                        |
| 🎨 **Perceptual color**      | Oklab interpolation via `lerpOklab` — no muddy browns. Compose it into any `onUpdate`.                         |
| 📐 **TypeScript-first**      | Full type exports, exhaustive discriminated unions, no `any`.                                                  |
| 🔧 **Ticker control**        | Bring your own game loop or use the built-in rAF ticker. Explicit — never auto-starts.                         |

## Primitives

### Timed (return `Animation`)

| Primitive                                   | Returns      | Description                                              |
| ------------------------------------------- | ------------ | -------------------------------------------------------- |
| [`createAnimation`](#createanimation)       | `Animation`  | Timed tween from A to B with easing, repeat, yoyo, delay |
| [`createAnimation` (keyframes)](#keyframes) | `Animation`  | Multi-segment interpolation with per-segment easing      |
| [`createTimeline`](#createtimeline)         | `Timeline`   | Orchestrate multiple animations on a shared timeline     |

Animations have `play()`/`pause()`/`resume()`/`stop()`/`skipToEnd()`/`kill()` controls, return a `Promise` from `play()`, and emit `onUpdate`/`onEnded`/`onProgress` callbacks.

### Continuous (return `Interpolation`)

| Primitive                               | Returns         | Description                                          |
| --------------------------------------- | --------------- | ---------------------------------------------------- |
| [`createSpring`](#createspring)         | `Interpolation` | Physics-based spring (Verlet integration)            |
| [`createSmoothDamp`](#createsmoothdamp) | `Interpolation` | Unity-style smooth damp, parameter-free chase        |
| [`createLerp`](#createlerp)             | `Interpolation` | First-order exponential chase, single rate parameter |

Interpolations have `start()`/`stop()`/`kill()` controls, auto-start on creation, and chase a target without a fixed duration. No promise — they run until stopped.

### Utility

| Primitive                                 | Returns              | Description                                   |
| ----------------------------------------- | -------------------- | --------------------------------------------- |
| [`createSmoothClamp`](#createsmoothclamp) | `(n: number) => n`   | Asymptotic clamp — saturates toward threshold |
| [`lerpOklab` / `hexToRgba`](#color)       | `RgbaTuple` / parser | Perceptually uniform color interpolation      |

## Usage

### createAnimation

Animate a single value from `from` to `to` over `durationMs`.

```ts
import { createAnimation } from "anim-engine";

const anim = createAnimation({
  from: 0,
  to: 100,
  durationMs: 2000,
  ease: "outElastic",
  onUpdate: (value, velocity) => {
    sprite.x = value;
  },
  onEnded: () => console.log("done"),
});

// Promise-based control
await anim.play(); // plays, resolves when done
anim.pause();
anim.resume();
anim.stop(); // resets to start
anim.skipToEnd(); // jumps to end, resolves promise
```

**Single-tween options:**

| Option       | Type                                         | Default     | Description                                                  |
| ------------ | -------------------------------------------- | ----------- | ------------------------------------------------------------ |
| `from`       | `number \| () => number`                     | —           | Start value (static or dynamic)                              |
| `to`         | `number \| () => number`                     | —           | End value (static or dynamic)                                |
| `durationMs` | `number`                                     | —           | Duration in milliseconds                                     |
| `ease`       | `EaseName \| EaseFunction`                   | `"inOutSine"` | Easing function or name                                    |
| `delayMs`    | `number`                                     | `0`         | Delay before starting                                        |
| `repeat`     | `number`                                     | `0`         | Times to repeat (set to `Infinity` for infinite)             |
| `yoyo`       | `boolean`                                    | `false`     | Alternate direction on repeat                                |
| `onStarted`  | `() => void`                                | —           | Called when animation begins (after delay)                   |
| `onUpdate`   | `(value: number, velocity: number) => void`  | —           | Called every frame with current value and velocity (units/s) |
| `onEnded`    | `() => void`                                | —           | Called when animation completes                              |
| `onRepeat`   | `() => void`                                | —           | Called at the start of each repeat cycle                     |

**Returns:** `Animation`

### Keyframes

Multi-segment animation with per-keyframe easing. The last keyframe's `at` value determines total duration. Mutually exclusive with `from`/`to`/`durationMs`.

```ts
import { createAnimation } from "anim-engine";

const anim = createAnimation({
  keyframes: [
    { at: 0, value: 0 },
    { at: 300, value: 50, ease: "outCubic" },
    { at: 700, value: 80, ease: "inOutQuad" },
    { at: 1000, value: 100 },
  ],
  onUpdate: (value) => (sprite.x = value),
  onProgress: (progress) => console.log(`${Math.round(progress * 100)}%`),
});
```

Each keyframe's `at` is in milliseconds — the last keyframe's `at` sets the total duration (1000ms in this example). If no `ease` is specified, the previous segment's ease carries forward.

**Keyframe options:**

| Option       | Type                                        | Description                                               |
| ------------ | ------------------------------------------- | --------------------------------------------------------- |
| `keyframes`  | `Keyframe[]`                                | Array of `{ at, value, ease? }` keyframes                 |
| `onUpdate`   | `(value: number, velocity: number) => void` | Called every frame with current value and velocity        |
| `onProgress` | `(progress: number) => void`                | Called every frame with 0–1 global progress               |
| `onEnded`    | `() => void`                               | Called when the keyframe animation completes              |

**Returns:** `Animation`

### Repeat & yoyo

```ts
import { createAnimation } from "anim-engine";

// Pulse — scale bounces between 1 and 1.3 forever
const pulse = createAnimation({
  from: 1,
  to: 1.3,
  durationMs: 600,
  ease: "inOutSine",
  repeat: Infinity,
  yoyo: true,
  onUpdate: (scale) => sprite.scale.set(scale),
});

// Flash — blink three times with a callback on each repeat
const flash = createAnimation({
  from: 1,
  to: 0,
  durationMs: 200,
  ease: "inOutSine",
  repeat: 3,
  yoyo: true,
  onRepeat: () => console.log("blink"),
  onUpdate: (alpha) => (sprite.alpha = alpha),
});
```

### createTimeline

Compose multiple animations on a shared timeline with `at` or `gap` positions.

```ts
import { createAnimation, createTimeline } from "anim-engine";

const fadeIn = createAnimation({
  from: 0,
  to: 1,
  durationMs: 500,
  onUpdate: (v) => (sprite.alpha = v),
});

const slideIn = createAnimation({
  from: -100,
  to: 0,
  durationMs: 800,
  ease: "outBack",
  onUpdate: (v) => (sprite.x = v),
});

const timeline = createTimeline(
  [
    { at: 0, animation: [fadeIn, slideIn] },
    { gap: 200, animation: slideIn },
  ],
  {
    onProgress: (progress) => console.log(`overall: ${progress}`),
  },
);

timeline.play();
```

**Parameters:**

```ts
type TimelineLayer =
  | { at: number; animation: Animation | Animation[] }
  | { gap: number; animation: Animation | Animation[] };
```

| Parameter            | Type                 | Description                                                    |
| -------------------- | -------------------- | -------------------------------------------------------------- |
| `layers`             | `TimelineLayer[]`    | Array of layers with `at` (absolute) or `gap` (relative) start |
| `options.onStarted`  | `() => void`         | Called when timeline begins                                    |
| `options.onProgress` | `(progress) => void` | Called every frame with overall 0–1 progress                   |
| `options.onEnded`    | `() => void`         | Called when timeline finishes                                  |

`gap` is relative to the end of all animations in the previous layer. Pass a single `Animation` or an array for parallel animations within the layer.

### Continuous primitives

Spring, smooth damp, and lerp are **continuous** — they auto-start and chase a target. They return `Interpolation` (no `play`/`pause`/`promise`).

#### createSpring

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

spring.setCurrentValue(0); // jump to start — spring chases back to 100

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

**Returns:** `Interpolation` — `start()`, `stop()`, `kill()`, `setCurrentValue(value)`, `currentValue`, `velocity`, `status`. Starts at the `to()` value. Use `setCurrentValue(value)` to jump elsewhere.

#### createSmoothDamp

```ts
import { createSmoothDamp } from "anim-engine";

const damp = createSmoothDamp({
  to: () => 100,
  smoothTimeMs: 300,
  maxSpeed: Infinity,
  onUpdate: (value, velocity) => (sprite.x = value),
});

damp.setCurrentValue(0); // jump to start — damp chases back to 100
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

lerp.setCurrentValue(0); // jump to start — lerp chases back to 100
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

Uses `threshold * (normalized / (1 + |normalized|))` for asymptotic saturation. Handles `Infinity` correctly. Returns a function `(value: number) => number` with a `setCurrentValue(0)` method to reset position.

### Color

Perceptually uniform Oklab interpolation. Straight RGB lerp produces muddy transitions — red→green goes through brown, blue→yellow goes through grey. Oklab matches human perception: equal steps look like equal changes.

```ts
import { lerpOklab, hexToRgba } from "anim-engine";

hexToRgba("#ff6b6b");  // → [1, 0.42, 0.42, 1]
hexToRgba("#f80");      // → [1, 0.533, 0, 1] (shorthand)
hexToRgba("#ff804080"); // → [1, 0.502, 0.251, 0.502] (with alpha)

const fromColor = hexToRgba("#ff6b6b");
const toColor = hexToRgba("#4ecdc4");

createAnimation({
  from: 0,
  to: 1,
  durationMs: 2000,
  ease: "outCubic",
  onUpdate: (t) => {
    const [r, g, b, a] = lerpOklab(fromColor, toColor, t);
    sprite.setColor(r, g, b, a);
  },
});
```

**With continuous primitives** — drive the blend factor via spring, damp, or lerp:

```ts
import { createSpring, lerpOklab, hexToRgba } from "anim-engine";

const fromColor = hexToRgba("#ff6b6b");
const toColor = hexToRgba("#4ecdc4");

const spring = createSpring({
  from: 0,
  to: () => (isHovered ? 1 : 0),
  stiffness: 180,
  damping: 12,
  onUpdate: (t) => {
    const [r, g, b] = lerpOklab(fromColor, toColor, t);
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

All primitives accept `number | (() => number)` for value parameters. Use a function to update the target every frame without recreating the animation:

```ts
const spring = createSpring({
  to: () => getMousePosition(), // starts at current mouse position // re-read every frame
  stiffness: () => sliderValue, // dynamic stiffness
  damping: () => dampingValue,
});
```

The function is called every frame inside the ticker update — no getter/setter objects, no mutation of the returned controls.

## Benchmarks

Performance comparison against GSAP (vitest bench, Apple Silicon M-series, Node 24).

| Benchmark                                    | anim-engine  | GSAP         | Ratio        |
| -------------------------------------------- | ------------ | ------------ | ------------ |
| **Single tween** (cubic, 1000 frames)        | 43,265 ops/s | 9,542 ops/s  | 4.53× faster |
| **Single tween** (linear, 1000 frames)       | 30,461 ops/s | 16,195 ops/s | 1.88× faster |
| **Single tween** (cubic bezier, 1000 frames) | 21,439 ops/s | 12,869 ops/s | 1.67× faster |
| **Keyframe** (3 segments, 1000 frames)       | 35,307 ops/s | 3,560 ops/s  | 9.92× faster |
| **50 concurrent tweens** (500 frames)        | 942 ops/s    | 473 ops/s    | 1.99× faster |
| **50 concurrent keyframes** (500 frames)     | 918 ops/s    | 171 ops/s    | 5.38× faster |

Easing functions are matched between libraries (cubic = GSAP `power2.out`, cubic bezier = identical control points via GSAP `CustomEase`). Linear strips out easing to show pure framework overhead.

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
| `lerpOklab(from, to, t)`           | Oklab color interpolation           |
| `hexToRgba(hex)`                   | Parse hex color to normalized RGBA  |

### Type exports

| Type                 | Description                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Animation`          | `play`, `pause`, `resume`, `stop`, `skipToEnd`, `kill`, `setCurrentValue`, `setProgress`, `currentValue`, `velocity`, `progress` (readonly), `status` |
| `Interpolation`      | `start`, `stop`, `kill`, `setCurrentValue`, `currentValue`, `velocity`, `status`                                             |
| `Timeline`           | `play`, `pause`, `resume`, `stop`, `skipToEnd`, `kill`, `setProgress`, `progress`, `status`                                            |
| `EaseName`           | Union of 31 ease name strings                                                                                           |
| `EaseFunction`       | `(t: number) => number`                                                                                                 |
| `DynamicValue`       | `number \| (() => number)`                                                                                             |
| `AnimationStatus`    | `"playing" \| "paused" \| "stopped" \| "dead"` (for `Animation` / `Timeline`)                                           |
| `InterpolationStatus` | `"active" \| "inactive" \| "dead"` (for `Interpolation`)                                           |
| `AnimationOptions`   | Single tween or keyframe animation options (discriminated union)                                                         |
| `Keyframe`           | `{ at, value, ease? }`                                                                                                  |
| `TimelineLayer`      | `{ at: number; animation: Animation \| Animation[] } \| { gap: number; animation: Animation \| Animation[] }`           |
| `SpringOptions`      | `to`, `stiffness`, `damping`, `mass`, `precision?`, `onUpdate`, `onEnded`                                                  |
| `SmoothDampOptions`  | `to`, `smoothTimeMs`, `maxSpeed?`, `precision?`, `onUpdate`, `onEnded`                                                                     |
| `LerpOptions`        | `to`, `smoothTimeMs`, `precision?`, `onUpdate`, `onEnded`                                                                                        |
| `RgbaTuple`          | `readonly [number, number, number, number]`                                                                             |
| `TickerControls`     | `start`, `stop`, `update`, `add`, `remove`                                                                              |

## License

MIT
