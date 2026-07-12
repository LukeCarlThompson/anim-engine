---
name: anim-engine
description: Renderer-agnostic numeric animation library for JavaScript runtimes. Use when a user has installed 'anim-engine' and needs help writing animation code with tweens, keyframes, timelines, springs, smooth damp, lerp, inertia, smooth scroll, or color interpolation. Covers all exported primitives, common recipes, game engine integration, and the ticker setup pattern.
metadata:
  triggers: "anim-engine, animation, createAnimation, createTimeline, createSpring, createSmoothDamp, createLerp, createSmoothClamp, createInertia, createSmoothScroll, inertia, smooth scroll, momentum scroll, lerpRgba, hexToRgba, animation library, js animation, tween, keyframe animation, timeline animation, spring physics"
---

# anim-engine

A renderer-agnostic animation library for JavaScript runtimes. Pure-numeric, tree-shakeable, zero dependencies. Works with DOM, Canvas, WebGL, Three.js, PixiJS, or any other renderer.

```
npm install anim-engine
```

---

## Getting Started

Import the primitives you need and start a ticker once per application. The ticker drives all animations — it does **not** auto-start.

> ⚠️ **Call `getTicker().start()` once** at your app's entry point, not inside a component or per animation.

```ts
import { createAnimation, getTicker } from "anim-engine";

// Start the ticker (rAF mode)
getTicker().start();

const anim = createAnimation({
  from: 0,
  to: 100,
  durationMs: 1000,
  ease: "outCubic",
  onUpdate: (value) => (element.style.transform = `translateX(${value}px)`),
});

await anim.play();
```

---

## Ticker Setup

The ticker must be started before any animations will advance. There are two modes:

> ⚠️ **Call `getTicker().start()` exactly once per application** — at your app's entry point or initialization, not inside a component, hook, or per-animation scope. Multiple calls are harmless (the ticker is a singleton), but instantiating separate ticker loops in components will fight each other, leak resources, and break frame timing.

### Automatic (rAF)

```ts
import { getTicker } from "anim-engine";
getTicker().start(); // Drives via requestAnimationFrame
```

### Custom game loop for all animations

Pass `deltaMs` (milliseconds) each frame:

```ts
const ticker = getTicker();
function loop(dt: number) {
  ticker.update(dt);
}
```

### External ticker (game engine integration)

Pass an `ExternalTicker` to individual animations to use the engine's own tick:

```ts
type ExternalTicker = {
  add: (handler: TickHandler) => void;
  remove: (handler: TickHandler) => void;
};
```

**Three.js:**

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

**PixiJS:**

```ts
const ticker = getTicker();
app.ticker.add((delta) => ticker.update(delta.deltaMS));
```

---

## Primitives

Two animation families:

| Family            | Factories                                        | What it does                                                 |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| **Timed**         | `createAnimation`, `createTimeline`              | Fixed motion path. Runs once per `play()`.                   |
| **Continuous**    | `createSpring`, `createSmoothDamp`, `createLerp`, `createInertia`, `createSmoothScroll` | Chases a live target every frame until stopped. |
| **Pure function** | `createSmoothClamp`                              | Asymptotic saturation — returns `(input: number) => number`. |

---

## Timed: `createAnimation`

### Single tween

Animates from one value to another over a duration with easing.

```ts
const anim = createAnimation({
  from: 0, // number or () => number
  to: 100, // number or () => number
  durationMs: 1000, // number or () => number
  ease: "outCubic", // EaseName or custom EaseFunction
  onUpdate: (value, velocity) => {
    /* assign value */
  },
  onProgress: (progress) => {}, // 0 → 1
  onStarted: () => {},
  onEnded: () => {},
});

await anim.play(); // Promise resolves when animation completes
```

### Keyframes

Multiple segments, each with its own value, duration (`gap`), and easing.

```ts
createAnimation({
  keyframes: [{ value: 0 }, { value: 50, gap: 300, ease: "outCubic" }, { value: 100, gap: 400 }],
  onUpdate: (v) => (sprite.x = v),
}).play();
```

The first keyframe provides the starting value; `gap` is the duration from the previous keyframe.

### Control handle

```ts
anim.play()         → Promise<void>   // Start or restart from beginning
anim.pause()        → void            // Freeze at current position
anim.resume()       → void            // Continue from paused position
anim.stop()         → void            // Stop; promise resolves at current value
anim.skipToEnd()    → void            // Jump to end value; promise resolves
anim.setProgress(p) → void            // Jump to progress [0, 1]; pauses if playing

anim.value          → number          // Current interpolated value (readonly)
anim.velocity       → number          // Current velocity in units/sec (readonly)
anim.progress       → number          // Progress 0→1 (readonly)
anim.status         → "playing" | "paused" | "stopped"
anim.durationMs     → number          // Total duration (readonly)
```

### Repeat & yoyo

Since `DynamicValue` is re-evaluated each `play()` call, alternating the source toggles direction:

```ts
let forward = true;

for (let i = 0; i < 6; i++) {
  await createAnimation({
    from: () => (forward ? 1 : 1.3),
    to: () => (forward ? 1.3 : 1),
    durationMs: 600,
    ease: "inOutSine",
    onUpdate: (v) => sprite.scale.set(v),
  }).play();
  forward = !forward;
}
```

---

## Timed: `createTimeline`

Orchestrate multiple keyframe animations in parallel or sequence.

```ts
import { createTimeline } from "anim-engine";

const timeline = createTimeline(
  [
    // Layer 1 — starts at time 0
    {
      at: 0,
      animation: {
        keyframes: [{ value: 0 }, { value: 1, gap: 500 }],
        onEnded: () => console.log("layer 1 done"),
      },
    },
    // Layer 2 — starts at time 0 (parallel)
    {
      at: 0,
      animation: {
        keyframes: [{ value: -100 }, { value: 0, gap: 800, ease: "outBack" }],
        onUpdate: (v) => (sprite.y = v),
      },
    },
    // Layer 3 — starts 200ms after layer 2 ends
    {
      gap: 200,
      animation: {
        keyframes: [{ value: 0 }, { value: 50, gap: 300 }],
        onEnded: () => console.log("layer 3 done"),
      },
    },
  ],
  {
    // values[i] / velocities[i] correspond to layer i in definition order
    onUpdate: (values, velocities) => {
      sprite.x = values[0]; // layer 1 (fade in)
      sprite.y = values[1]; // layer 2 (slide up)
      sprite.rotation = values[2]; // layer 3 (spin)
    },
    onProgress: (p) => console.log(p),
  },
);
```

- Layer positions: `at: DynamicValue` (absolute ms) or `gap: number` (relative to previous layer end).
- **Each layer supports its own callbacks.** Pass `onStarted`, `onUpdate`, `onProgress`, and `onEnded` inside the layer's `animation` config to react to per-layer events independently.
- Timeline handle has the same shape as `Animation`: `play()`, `pause()`, `resume()`, `stop()`, `skipToEnd()`, `setProgress()`.
- `values` and `velocities` are arrays — one entry per layer in definition order.

---

## Continuous: `createSpring`

Mass-spring-damper physics. Bouncy or elastic movement toward a live target.

```ts
const spring = createSpring({
  to: () => mouseX, // Re-evaluated every frame
  stiffness: 180, // default — higher = snappier
  damping: 12, // default — higher = less oscillation
  mass: 1, // default — higher = heavier feel
  precision: 0.01, // default — settles within this tolerance
  onUpdate: (value, velocity) => {
    sprite.x = value;
  },
  onEnded: () => {},
});

// Later:
spring.stop();
spring.setValue(50); // Immediately set position
```

Uses Verlet integration for stable, energy-conserving simulation.

Starts active automatically. Call `stop()` to halt.

---

## Continuous: `createSmoothDamp`

Natural deceleration toward a target (Unity-style `SmoothDamp`).

```ts
import { createSmoothDamp } from "anim-engine";

const damp = createSmoothDamp({
  to: () => targetY,
  smoothTimeMs: 300, // Approximate time to reach target
  maxSpeed: undefined, // Optional velocity cap
  precision: 0.01,
  onUpdate: (value, vel) => {
    /* assign */
  },
  onEnded: () => {},
});
```

---

## Continuous: `createLerp`

Exponential approach. Always moves toward target, never overshoots.

```ts
const lerp = createLerp({
  to: () => targetX,
  smoothTimeMs: 300,
  precision: 0.01,
  onUpdate: (value, vel) => {
    /* assign */
  },
  onEnded: () => {},
});
```

---

## Gesture-driven: `createInertia`

Exponential velocity decay for drag-to-throw gestures. Call `track(position)` every frame while dragging — it records position and computes velocity from the frame-to-frame delta. On `release()`, velocity decays exponentially and the value coasts to a stop.

```ts
import { createInertia } from "anim-engine";

const inertia = createInertia({
  decelerationMs: 300, // Time constant — higher = longer coast
  precision: 0.5,       // Settling threshold
  onUpdate: (value, velocity) => {
    block.style.left = `${value}px`;
  },
  onEnded: () => {},
});

// During drag:
inertia.track(e.clientX);

// On release:
inertia.release(); // Velocity decays to stop

// Teleport instantly:
inertia.setValue(50);
```

Self-registers on the ticker while active (tracking or coasting), removes itself when settled — no explicit lifecycle management needed.

---

## Gesture-driven: `createSmoothScroll`

Delta-based momentum scroll built on top of smooth damp. Manages an internal target clamped on write so there's no dead zone when coming back from overscroll. Add deltas via `addDelta()` and the value smooth-damps toward the cumulative target every frame.

```ts
import { createSmoothScroll } from "anim-engine";

const scroll = createSmoothScroll({
  smoothTimeMs: 30,  // Response time — lower = snappier
  min: 0,
  max: 650,
  precision: 0.5,
  onUpdate: (value) => {
    viewport.style.transform = `translateX(${-value}px)`;
  },
  onEnded: () => {},
});

// Re-sync on pointer grab:
scroll.setValue(scroll.value);

// Wheel event:
scroll.addDelta(e.deltaY);

// Pointer move:
scroll.addDelta(e.clientX - lastX);
```

Self-registers on the ticker only while animating toward the target — automatically stops when settled.

---

## Pure function: `createSmoothClamp`

Asymptotic saturation — caps a value with smooth deceleration. No control handle, no ticker.

```ts
import { createSmoothClamp } from "anim-engine";

const clamp = createSmoothClamp(45); // max velocity

clamp(1000); // ≈ 44.96 (asymptotic to 45)
clamp(5); // ≈ 4.99
```

Useful for limiting velocity, torque, force, or any value that should approach a maximum smoothly.

---

## Color

Perceptually uniform Oklab color interpolation.

```ts
import { lerpRgba, hexToRgba } from "anim-engine";

const from = hexToRgba("#ff6b6b"); // → [1, 0.42, 0.42, 1] (normalized RGBA)
const to = hexToRgba("#4ecdc4");

createAnimation({
  from: 0,
  to: 1,
  durationMs: 2000,
  onUpdate: (t) => {
    const [r, g, b, a] = lerpRgba(from, to, t);
    element.style.color = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
  },
});
```

Accepted hex formats: `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`.

---

## Dynamic Values

`DynamicValue` (`number | () => number`) lets values be static or computed lazily.

Resolution timing depends on the primitive:

| Primitive                                          | `from` / `to` / `gap` / `smoothTimeMs` resolved |
| -------------------------------------------------- | ----------------------------------------------- |
| `createAnimation` (tween)                          | Once per `play()` call, cached for duration     |
| `createAnimation` (keyframes)                      | Once per `play()` call                          |
| `createTimeline`                                   | Once per `play()` call                          |
| `createSpring` / `createSmoothDamp` / `createLerp` | **Every frame** (target is a live value)        |
| `createInertia`                                     | `decelerationMs` resolved **every frame** while coasting |
| `createSmoothScroll`                                | `smoothTimeMs`, `min`, `max` resolved **every frame**   |

```ts
// Static value — resolved once
createAnimation({ from: 0, to: 100, durationMs: 1000 });

// Dynamic — function called at resolution time
createAnimation({
  from: () => getCurrentX(),
  durationMs: () => 500 / speedMultiplier,
});

// Continuous — function called every frame
createSpring({ to: () => mouseX });
```

---

## Easing

31 named presets plus custom cubic bezier.

```ts
type EaseName =
  | "linear"
  | "inQuad"
  | "outQuad"
  | "inOutQuad"
  | "inCubic"
  | "outCubic"
  | "inOutCubic"
  | "inQuart"
  | "outQuart"
  | "inOutQuart"
  | "inQuint"
  | "outQuint"
  | "inOutQuint"
  | "inSine"
  | "outSine"
  | "inOutSine"
  | "inExpo"
  | "outExpo"
  | "inOutExpo"
  | "inCirc"
  | "outCirc"
  | "inOutCirc"
  | "inBack"
  | "outBack"
  | "inOutBack"
  | "inElastic"
  | "outElastic"
  | "inOutElastic"
  | "inBounce"
  | "outBounce"
  | "inOutBounce";
```

Custom bezier:

```ts
import { cubicBezier } from "anim-engine";

const ease = cubicBezier(0.25, 0.1, 0.25, 1);

createAnimation({ from: 0, to: 100, durationMs: 1000, ease });
```

Custom function:

```ts
createAnimation({
  from: 0,
  to: 100,
  durationMs: 1000,
  ease: (t) => t * t, // custom quadratic
});
```

---

## Common Recipes

### Animating CSS transforms

```ts
const anim = createAnimation({
  from: 0,
  to: 100,
  durationMs: 2000,
  ease: "outElastic",
  onUpdate: (v) => {
    element.style.transform = `translateX(${v}px) rotate(${v * 0.1}deg)`;
  },
});
```

### Animating canvas drawing

```ts
const ctx = canvas.getContext("2d");
let progress = 0;

createAnimation({
  keyframes: [{ value: 0 }, { value: 1, gap: 1000, ease: "inOutSine" }],
  onUpdate: (v) => {
    progress = v;
  },
}).play();

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(100 + progress * 200, 100, 30, 0, Math.PI * 2);
  ctx.fill();
  requestAnimationFrame(draw);
}
draw();
```

### Spring-loaded UI element

```ts
import { createSpring } from "anim-engine";

createSpring({
  to: () => mouseX,
  stiffness: 160,
  damping: 14,
  onUpdate: (x) => (cursor.style.left = `${x}px`),
});
```

### Fade in with smooth damp

```ts
createSmoothDamp({
  to: () => (visible ? 1 : 0),
  smoothTimeMs: 400,
  onUpdate: (v) => (element.style.opacity = String(v)),
});
```

### Polling values in a game loop

Read-only `value` and `velocity` properties let you poll instead of using callbacks:

```ts
const spring = createSpring({ to: () => enemy.targetX });

function gameLoop(dt: number) {
  ticker.update(dt);
  enemy.x = spring.value; // Read current position
  enemy.vx = spring.velocity; // Read current velocity
}
```

### Drag-to-throw with inertia

```ts
import { createInertia } from "anim-engine";

const inertia = createInertia({
  decelerationMs: 400,
  onUpdate: (v) => (card.style.transform = `translateX(${v}px)`),
});

card.addEventListener("pointerdown", (e) => {
  inertia.track(e.clientX);
  card.setPointerCapture(e.pointerId);
});
card.addEventListener("pointermove", (e) => {
  if (e.buttons) inertia.track(e.clientX);
});
card.addEventListener("pointerup", () => inertia.release());
card.addEventListener("pointercancel", () => inertia.release());
```

### Momentum scroll with smooth scroll

```ts
import { createSmoothScroll } from "anim-engine";

const scroll = createSmoothScroll({
  smoothTimeMs: 30,
  min: 0,
  max: 1200,
  onUpdate: (v) => (track.style.transform = `translateX(${-v}px)`),
});

// Wheel
viewport.addEventListener("wheel", (e) => {
  e.preventDefault();
  scroll.addDelta(e.deltaX || e.deltaY);
}, { passive: false });

// Pointer drag
let lastX = 0;
viewport.addEventListener("pointerdown", (e) => {
  lastX = e.clientX;
  scroll.setValue(scroll.value);
  viewport.setPointerCapture(e.pointerId);
});
viewport.addEventListener("pointermove", (e) => {
  if (e.buttons) {
    scroll.addDelta(-(e.clientX - lastX));
    lastX = e.clientX;
  }
});
```
