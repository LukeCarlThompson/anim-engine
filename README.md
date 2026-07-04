# anim-engine

**Renderer-agnostic animation for JavaScript runtimes.** A pure numeric engine — no DOM, no canvas, no coupling to your renderer. Feed it values, bridge the output to PixiJS, ThreeJS, canvas2d, or the DOM.

```ts
import { createAnimation } from "anim-engine";

const anim = createAnimation({
  from: 0,
  to: 100,
  durationMs: 1000,
  ease: "outCubic",
  onUpdate: (value) => (sprite.x = value),
});

await anim.play();
```

## Install

```sh
npm install anim-engine
```

ESM only. Tree-shakeable — import only what you use.

## Primitives

| Primitive                                   | Description                                              |
| ------------------------------------------- | -------------------------------------------------------- |
| [`createAnimation`](#createanimation)       | Timed tween from A to B with easing, repeat, yoyo, delay |
| [`createAnimation` (keyframes)](#keyframes) | Multi-segment interpolation with per-segment easing      |
| [`createTimeline`](#createtimeline)         | Orchestrate multiple animations on a shared timeline     |
| [`createSpring`](#createspring)             | Physics-based spring (Verlet integration), auto-chases   |
| [`createSmoothDamp`](#createsmoothdamp)     | Unity-style smooth damp, parameter-free chase            |
| [`createLerp`](#createlerp)                 | First-order exponential chase, single rate parameter     |
| [`createSmoothClamp`](#createsmoothclamp)   | Asymptotic clamp — saturates input toward a threshold    |
| [`lerpOklab` / `hexToRgba`](#color)         | Perceptually uniform color interpolation (Oklab)         |

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
  onEnded: () => console.log("done!"),
});

// Promise-based control
await anim.play(); // plays, resolves when done
anim.pause();
anim.resume();
anim.stop(); // resets to start
anim.skipToEnd(); // jumps to end, resolves promise
```

**Options:**

| Option       | Type                        | Default    | Description                                                  |
| ------------ | --------------------------- | ---------- | ------------------------------------------------------------ |
| `from`       | `number \| () => number`    | —          | Start value (static or dynamic)                              |
| `to`         | `number \| () => number`    | —          | End value (static or dynamic)                                |
| `durationMs` | `number`                    | —          | Duration in milliseconds                                     |
| `ease`       | `EaseName \| EaseFunction`  | `"linear"` | Easing function or name                                      |
| `delay`      | `number`                    | `0`        | Delay before starting                                        |
| `repeat`     | `number`                    | `0`        | Times to repeat (set to `Infinity` for infinite)             |
| `yoyo`       | `boolean`                   | `false`    | Alternate direction on repeat                                |
| `onUpdate`   | `(value, velocity) => void` | —          | Called every frame with current value and velocity (units/s) |
| `onEnded`    | `() => void`                | —          | Called when animation completes                              |
| `onProgress` | `(progress) => void`        | —          | Called every frame with 0–1 progress                         |

**Returns:** `Animation<number>`

### Keyframes

Multi-segment animation with per-keyframe easing. The last keyframe's `at` value determines total duration.

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
});
```

Each keyframe's `at` is in milliseconds — the last keyframe's `at` sets the total duration (1000ms in this example). If no `ease` is specified, the previous segment's ease carries forward.

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

const timeline = createTimeline([
  { at: 0, animation: [fadeIn, slideIn] }, // both start together
  { gap: 200, animation: slideIn }, // single animation — no array needed
], {
  onProgress: (progress) => console.log(`overall: ${progress}`),
});

timeline.play();
```

**Parameters:**

```ts
type TimelineLayer =
  | { at: number; animation: Animation | Animation[] }
  | { gap: number; animation: Animation | Animation[] };
```

| Parameter   | Type                 | Description                                                    |
| ----------- | -------------------- | -------------------------------------------------------------- |
| `layers`    | `TimelineLayer[]`    | Array of layers with `at` (absolute) or `gap` (relative) start |
| `options.onStarted`  | `() => void` | Called when timeline begins                                    |
| `options.onProgress` | `(progress) => void` | Called every frame with overall 0–1 progress                   |
| `options.onEnded`    | `() => void` | Called when timeline finishes                                  |

`gap` is relative to the end of all animations in the previous layer. Pass a single `Animation` or an array for parallel animations within the layer.

### Continuous primitives

Spring, smooth damp, and lerp are **continuous** — they auto-start and chase a target. They return `Interpolation` (no `play`/`pause`/`promise`).

#### createSpring

```ts
import { createSpring } from "anim-engine";

const spring = createSpring({
  from: 0,
  to: 100,
  stiffness: 180,
  damping: 12,
  mass: 1,
  precision: 0.01,
  onUpdate: (value, velocity) => {
    sprite.x = value;
  },
});

// Dynamic target — mouse chase
const targetX = { value: 0 };
document.addEventListener("mousemove", (e) => {
  targetX.value = e.clientX;
});

const follower = createSpring({
  from: 0,
  to: () => targetX.value, // re-read every frame
  stiffness: 200,
  damping: 15,
  onUpdate: (v) => (sprite.x = v),
});
```

All parameters (`stiffness`, `damping`, `mass`, `to`) accept `number | (() => number)` — resolved every frame.

**Returns:** `Interpolation<number>` — `start()`, `stop()`, `kill()`, `setCurrent(value)`.

#### createSmoothDamp

```ts
import { createSmoothDamp } from "anim-engine";

const damp = createSmoothDamp({
  from: 0,
  to: 100,
  smoothTime: 0.3,
  maxSpeed: Infinity,
  onUpdate: (value, velocity) => (sprite.x = value),
});
```

Unity-style smooth damp with Taylor-series exponential approximation. No stiffness/damping/mass to tune — just `smoothTime` (seconds to reach target).

**Returns:** `Interpolation<number>`

#### createLerp

```ts
import { createLerp } from "anim-engine";

const lerp = createLerp({
  from: 0,
  to: 100,
  rate: 3, // convergence rate (higher = faster)
  onUpdate: (value, velocity) => (sprite.x = value),
});
```

First-order exponential approach: `value += (target - value) * rate * deltaTime`. Frame-rate independent.

**Returns:** `Interpolation<number>`

### createSmoothClamp

```ts
import { createSmoothClamp } from "anim-engine";

const clamp = createSmoothClamp(45); // threshold = 45 units/s

const result = clamp(1000); // → ~44.96 (approaches 45 asymptotically)
const result2 = clamp(-500); // → ~-44.96 (symmetric)
```

Uses `threshold * (normalized / (1 + |normalized|))` for asymptotic saturation. Handles `Infinity` correctly. Returns `setCurrent(0)` to reset position.

### Color

```ts
import { lerpOklab, hexToRgba } from "anim-engine";

const fromColor = hexToRgba("#ff6b6b"); // → [1, 0.42, 0.42, 1]
const toColor = hexToRgba("#4ecdc4"); // → [0.31, 0.80, 0.77, 1]

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

Perceptually uniform Oklab interpolation — avoids muddy brown midpoints that RGB lerp produces. Alpha lerps linearly.

## Benchmarks

Performance comparison against GSAP (vitest bench, Apple Silicon M-series, Node 24).

| Benchmark                                | anim-engine  | GSAP         | Ratio        |
| ---------------------------------------- | ------------ | ------------ | ------------ |
| **Single tween** (1000 frames)           | 12,666 ops/s | 11,164 ops/s | 1.13× faster |
| **Keyframe** (3 segments, 1000 frames)   | 14,012 ops/s | 3,541 ops/s  | 3.96× faster |
| **50 concurrent tweens** (500 frames)    | 592 ops/s    | 471 ops/s    | 1.26× faster |
| **50 concurrent keyframes** (500 frames) | 720 ops/s    | 174 ops/s    | 4.14× faster |

Run locally: `npm run bench`

### Ticker

The ticker does **not** auto-start. You must explicitly call `start()` (for rAF) or `update(deltaMs)` (for custom game loops) to drive animations.

Primitives register themselves with the ticker on creation — no manual registration needed.

**Standalone (rAF):** `getTicker().start()` uses its own `requestAnimationFrame` loop. Best for DOM-based demos or when you don't have a game loop.

```ts
import { getTicker, createAnimation } from "anim-engine";

getTicker().start(); // starts the rAF loop

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

### Easing

31 Penner easing functions plus custom cubic bezier:

```ts
import { cubicBezier, EASE_NAMES, createAnimation } from "anim-engine";

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

### Dynamic values

All primitives accept `number | (() => number)` for value parameters. Use a function to update the target every frame without recreating the animation:

```ts
const spring = createSpring({
  from: 0,
  to: () => getMousePosition(), // re-read every frame
  stiffness: () => sliderValue, // dynamic stiffness
  damping: () => dampingValue,
});
```

The function is called every frame inside the ticker update — no getter/setter objects, no mutation of the returned controls.

## API Reference

### Functions

| Export                            | Description                         |
| --------------------------------- | ----------------------------------- |
| `createAnimation(options)`        | Timed or keyframe animation         |
| `createTimeline(layers, options?)` | Composited timeline of animations   |
| `createSpring(options)`           | Physics spring (Verlet integration) |
| `createSmoothDamp(options)`       | Unity-style smooth damp             |
| `createLerp(options)`             | Exponential lerp chase              |
| `createSmoothClamp(threshold)`    | Asymptotic clamp factory            |
| `getTicker()`                     | Singleton ticker                    |
| `cubicBezier(p1x, p1y, p2x, p2y)` | Custom cubic bezier easing          |
| `lerpOklab(from, to, t)`          | Oklab color interpolation           |
| `hexToRgba(hex)`                  | Parse hex color to normalized RGBA  |

### Type exports

| Type                 | Description                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `Animation`          | `play`, `pause`, `resume`, `stop`, `skipToEnd`, `kill`, `setCurrent`, `currentValue`, `velocity`, `progress`, `status` |
| `Interpolation`      | `start`, `stop`, `kill`, `setCurrent`, `currentValue`, `velocity`, `status`                                            |
| `EaseName`           | Union of 31 ease name strings                                                                                          |
| `EaseFunction`       | `(t: number) => number`                                                                                                |
| `DynamicValue<T>`    | `T \| (() => T)`                                                                                                       |
| `Status`             | `"playing" \| "paused" \| "stopped" \| "dead"`                                                                         |
| `AnimationOptions`   | Single tween or keyframe animation options                                                                             |
| `SingleTweenOptions` | `from`, `to`, `durationMs`, `ease`, `delay`, `repeat`, `yoyo`                                                          |
| `KeyframeOptions`    | `keyframes: Keyframe[]`                                                                                                |
| `Keyframe`           | `{ at, value, ease? }`                                                                                                 |
| `TimelineLayer`      | `{ at: number; animation: Animation \| Animation[] } \| { gap: number; animation: Animation \| Animation[] }`          |
| `SpringOptions`      | `from`, `to`, `stiffness`, `damping`, `mass`, `precision?`, `onUpdate`                                                 |
| `SmoothDampOptions`  | `from`, `to`, `smoothTime`, `maxSpeed?`, `onUpdate`                                                                    |
| `LerpOptions`        | `from`, `to`, `rate`, `onUpdate`                                                                                       |
| `RgbaTuple`          | `readonly [number, number, number, number]`                                                                            |
| `TickerControls`     | `start`, `stop`, `update`                                                                                              |

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

## Design

- **No target mutation** — pure numeric engine. Bridge values to your world via `onUpdate`.
- **No GC pressure** — zero allocations in the update loop. Pre-computed lookup tables, flat arrays with tombstone compaction.
- **All functions, no classes** — factory closures throughout. No `this`, no `class`, arrow functions only.
- **No barrel files** — explicit path imports for reliable tree-shaking and no circular deps.
- **`undefined` over `null`** — no `null` literals in library source.

## License

MIT

<!-- TODO: Make animations updateable without a ticker? -->
