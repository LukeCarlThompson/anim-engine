<h1 align="center">anim-engine</h1>

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/anim-engine.svg)](https://www.npmjs.com/package/anim-engine)
[![License](https://img.shields.io/npm/l/anim-engine.svg)](https://github.com/LukeCarlThompson/anim-engine/blob/main/packages/anim-engine/LICENSE)
[![CI](https://github.com/LukeCarlThompson/anim-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/LukeCarlThompson/anim-engine/actions)

</div>

**Renderer-agnostic animation for JavaScript runtimes.** Pure-numeric, tree-shakeable, zero dependencies.

```sh
npm install anim-engine
```

```ts
import { createAnimation, getTicker } from "anim-engine";

getTicker().start();

const anim = createAnimation({
  from: 0, to: 100, durationMs: 1000, ease: "outCubic",
  onUpdate: (value) => (sprite.x = value),
});

await anim.play();
```

## Design

Anim Engine is built around the same concepts used in animation applications, applied to pure numbers.

**Timed motion** — a fixed path evaluated when `play()` is called.

- **Tween** — animate from value A to value B over a duration with easing.
- **Keyframes** — multi-segment motion describing a value at specific points in time.
- **Timeline** — orchestrate multiple keyframe animations in parallel, sequence, or staggered offset.

**Continuous motion** — chases a live target every frame.

- **Spring** — mass-spring-damper physics for bouncy or elastic movement.
- **Smooth damp** — natural deceleration toward a target (Unity-style).
- **Lerp** — exponential approach for smooth asymptotic tracking.
- **Smooth clamp** — asymptotic saturation for capping velocity, torque, or force.

**Color helpers** — Oklab-based composable interpolation.

- **`lerpRgba`** — interpolates between two RGBA colors in perceptually uniform space.
- **`hexToRgba`** — parse hex color strings (`#RGB`, `#RRGGBB`, etc.) to normalized RGBA.

### Deliberately decoupled

Anim Engine works strictly with numbers to stay renderer-agnostic. Each function accepts an `onUpdate` callback with the latest value and velocity — assign it to a DOM element, WebGL object, or any other target. Read-only `value` and `velocity` properties are also exposed for polling inside a game loop.

- [Primitives](#primitives)
- [At a glance](#at-a-glance)
- [Examples](#examples)
- [Easing](#easing)
- [Dynamic values](#dynamic-values)
- [Color](#color)
- [Ticker](#ticker)
- [Game engine integration](#game-engine-integration)
- [Benchmarks](#benchmarks)

---

## Primitives

Two families with complementary shapes:

| Family | Functions | Lifespan |
|---|---|---|
| **Timed** | `createAnimation`, `createTimeline` | Fixed motion path, runs once per `play()` |
| **Continuous** | `createSpring`, `createSmoothDamp`, `createLerp` | Chases a live target until stopped |

All return a control handle with `value`, `velocity`, `status`, and lifecycle methods.

`createSmoothClamp` is a pure function factory (no handle — returns `(input: number) => number`).

## At a glance

### Timed — `Animation`

```ts
type Animation = {
  play: () => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  skipToEnd: () => void
  setProgress: (value: number) => void

  value: number
  velocity: number
  progress: number       // 0 → 1
  status: "playing" | "paused" | "stopped"
  durationMs: number
}
```

**Options — single tween:**

```ts
type TweenOptions = {
  from: DynamicValue
  to: DynamicValue
  durationMs: DynamicValue
  ease?: EaseName | EaseFunction
  onStarted?: () => void
  onUpdate?: (value: number, velocity: number) => void
  onProgress?: (progress: number) => void
  onEnded?: () => void
  ticker?: ExternalTicker
}
```

**Options — keyframes:**

```ts
type KeyframeOptions = {
  keyframes: Keyframe[]
  onStarted?: () => void
  onUpdate?: (value: number, velocity: number) => void
  onProgress?: (progress: number) => void
  onEnded?: () => void
  ticker?: ExternalTicker
}

type Keyframe = {
  value: DynamicValue
  gap?: DynamicValue    // ms from previous keyframe
  ease?: EaseName | EaseFunction
}
```

### Timed — `Timeline`

Layers multiple keyframe animations in parallel or sequence.

```ts
type Timeline = {
  play: () => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  skipToEnd: () => void
  setProgress: (value: number) => void

  values: number[]      // one per layer
  velocities: number[]  // one per layer
  progress: number
  status: "playing" | "paused" | "stopped"
  durationMs: number
}
```

```ts
type TimelineLayer =
  | { animation: KeyframeOptions; at: DynamicValue }      // absolute position
  | { animation: KeyframeOptions; gap: number }            // relative to previous layer end
```

### Continuous — `Interpolation`

```ts
type Interpolation = {
  resume: () => void
  stop: () => void
  setValue: (value: number) => void

  value: number
  velocity: number
  status: "active" | "inactive"
}
```

**Options:**

```ts
type SpringOptions = {
  to: () => number
  stiffness?: DynamicValue   // default 180
  damping?: DynamicValue     // default 12
  mass?: DynamicValue        // default 1
  precision?: number         // default 0.01
  onUpdate?: (value: number, velocity: number) => void
  onEnded?: () => void
  ticker?: ExternalTicker
}

type SmoothDampOptions = {
  to: () => number
  smoothTimeMs: DynamicValue
  maxSpeed?: DynamicValue
  precision?: number         // default 0.01
  onUpdate?: (value: number, velocity: number) => void
  onEnded?: () => void
  ticker?: ExternalTicker
}

type LerpOptions = {
  to: () => number
  smoothTimeMs: DynamicValue
  precision?: number         // default 0.01
  onUpdate?: (value: number, velocity: number) => void
  onEnded?: () => void
  ticker?: ExternalTicker
}
```

### Common option patterns

| | `from` | `to` / target | `onUpdate` values | `durationMs` / `smoothTimeMs` |
|---|---|---|---|---|
| `createAnimation` (tween) | ✅ `DynamicValue` | ✅ `DynamicValue` | single `(value, velocity)` | ✅ `DynamicValue` |
| `createAnimation` (keyframes) | — (first keyframe) | — (last keyframe) | single `(value, velocity)` | — (sum of gaps) |
| `createTimeline` | — | — | multi `(values[], velocities[])` | — (computed) |
| `createSpring` | — (chases current) | ✅ `() => number` | single `(value, velocity)` | — (physics params) |
| `createSmoothDamp` | — (chases current) | ✅ `() => number` | single `(value, velocity)` | ✅ `DynamicValue` |
| `createLerp` | — (chases current) | ✅ `() => number` | single `(value, velocity)` | ✅ `DynamicValue` |

### Shared options

```ts
type DynamicValue = number | (() => number)

type ExternalTicker = {
  add: (handler: TickHandler) => void
  remove: (handler: TickHandler) => void
}
```

---

## Examples

### Single tween

```ts
const anim = createAnimation({
  from: 0, to: 100, durationMs: 2000, ease: "outElastic",
  onUpdate: (v) => (sprite.x = v),
});
await anim.play();
```

### Keyframes

```ts
createAnimation({
  keyframes: [
    { value: 0 },
    { value: 50, gap: 300, ease: "outCubic" },
    { value: 100, gap: 400 },
  ],
  onUpdate: (v) => (sprite.x = v),
}).play();
```

### Repeat & yoyo

```ts
const anim = createAnimation({
  from: () => (forward ? 1 : 1.3),
  to: () => (forward ? 1.3 : 1),
  durationMs: 600, ease: "inOutSine",
  onUpdate: (v) => sprite.scale.set(v),
});

for (let i = 0; i < 6; i++) {
  forward = !forward;
  await anim.play();
}
```

### Timeline

```ts
createTimeline([
  { at: 0, animation: { keyframes: [{ value: 0 }, { value: 1, gap: 500 }] } },
  { at: 0, animation: { keyframes: [{ value: -100 }, { value: 0, gap: 800, ease: "outBack" }] } },
], {
  onProgress: (p) => console.log(p),
  onUpdate: (values, velocities) => { /* one entry per layer */ },
});
```

### Spring

```ts
const spring = createSpring({
  to: () => mouseX,
  stiffness: 180, damping: 12,
  onUpdate: (v) => (sprite.x = v),
});
```

### Smooth damp

```ts
createSmoothDamp({
  to: () => 100, smoothTimeMs: 300,
  onUpdate: (v) => (sprite.x = v),
});
```

### Lerp

```ts
createLerp({
  to: () => 100, smoothTimeMs: 300,
  onUpdate: (v) => (sprite.x = v),
});
```

### Smooth clamp

```ts
const clamp = createSmoothClamp(45);
clamp(1000); // ≈ 44.96 (asymptotic to 45)
```

---

## Easing

31 named presets plus custom cubic bezier:

```ts
type EaseName =
  | "linear" | "inQuad" | "outQuad" | "inOutQuad"
  | "inCubic" | "outCubic" | "inOutCubic"
  | "inQuart" | "outQuart" | "inOutQuart"
  | "inQuint" | "outQuint" | "inOutQuint"
  | "inSine" | "outSine" | "inOutSine"
  | "inExpo" | "outExpo" | "inOutExpo"
  | "inCirc" | "outCirc" | "inOutCirc"
  | "inBack" | "outBack" | "inOutBack"
  | "inElastic" | "outElastic" | "inOutElastic"
  | "inBounce" | "outBounce" | "inOutBounce"

type EaseFunction = (t: number) => number
```

Custom bezier:

```ts
const ease = cubicBezier(0.25, 0.1, 0.25, 1);
createAnimation({ from: 0, to: 100, durationMs: 1000, ease, ... });
```

---

## Dynamic values

`DynamicValue` (`number | (() => number)`) is resolved at different frequencies depending on the primitive:

- **Timed animations** — resolved once per `play()` call and cached for the run.
- **Continuous primitives** — resolved every frame (targets are live).

```ts
// Resolved at play time, cached for duration
createAnimation({
  from: () => getX(),
  durationMs: () => 500 / speed,
  keyframes: [{ value: 0 }, { value: () => targetY, gap: 300 }],
}).play();

// Resolved every frame
createSpring({ to: () => mouseX, ... });
```

---

## Color

Oklab (perceptually uniform) color interpolation via `lerpRgba`.

```ts
const from = hexToRgba("#ff6b6b");  // [1, 0.42, 0.42, 1]
const to = hexToRgba("#4ecdc4");

createAnimation({
  from: 0, to: 1, durationMs: 2000,
  onUpdate: (t) => {
    const [r, g, b, a] = lerpRgba(from, to, t);
    sprite.setColor(r, g, b, a);
  },
});
```

Accepts `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA` formats.

---

## Ticker

Does **not** auto-start. Explicit control:

```ts
import { getTicker } from "anim-engine";

// rAF mode
getTicker().start();

// Custom game loop
const ticker = getTicker();
function loop(dt: number) {
  ticker.update(dt);
}
```

Stop with `getTicker().stop()`.

---

## Game engine integration

### PixiJS

```ts
import { createAnimation, getTicker } from "anim-engine";
const ticker = getTicker();

app.ticker.add((delta) => ticker.update(delta.deltaMS));

createAnimation({ from: 0, to: 300, durationMs: 2000, ease: "outElastic",
  onUpdate: (x) => (sprite.x = x),
}).play();
```

### ThreeJS

```ts
const clock = new THREE.Clock();
const ticker = getTicker();

function animate() {
  requestAnimationFrame(animate);
  ticker.update(clock.getDelta() * 1000);
  renderer.render(scene, camera);
}
animate();
```

---

## Benchmarks

vs GSAP (vitest bench, Apple Silicon M-series, Node 24). Matched easing functions.

| Benchmark | anim-engine | GSAP | Ratio |
|---|---|---|---|
| Single tween (cubic, 1000 frames) | 40,814 ops/s | 10,776 ops/s | 3.8× |
| Single tween (bezier, 1000 frames) | 21,449 ops/s | 12,637 ops/s | 1.7× |
| Keyframe (3 segments, 1000 frames) | 26,741 ops/s | 3,549 ops/s | 7.5× |
| 50 concurrent tweens (500 frames) | 892 ops/s | 438 ops/s | 2.0× |
| 200 concurrent tweens (500 frames) | 200 ops/s | 106 ops/s | 1.9× |
| 1000 concurrent tweens (500 frames) | 38 ops/s | 22 ops/s | 1.7× |
| 50-layer timeline (500 frames) | 710 ops/s | 404 ops/s | 1.8× |
| 50 tweens re-play (500 frames) | 558 ops/s | 128 ops/s | 4.4× |

vs GSAP `onUpdate` (apples-to-apples): **3.0–6.2× faster**.

Run locally: `npm run bench`

---

## License

MIT
