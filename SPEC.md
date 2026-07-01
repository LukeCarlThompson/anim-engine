# Anim Engine — Specification

> **Status**: Draft v0.2 (post-grilling)
> A renderer-agnostic animation toolkit for JavaScript runtimes — ideal for PixiJS, ThreeJS, and game development.

---

## 1. Overview & Philosophy

Anim Engine is a JavaScript/TypeScript library for animating numeric values over time. It is:

- **Renderer-agnostic** — works with DOM, Canvas, Three.js, PixiJS, WebGL, or any custom system. No DOM coupling.
- **Tree-shakable** — only bundle the parts you use.
- **Promise-based** — `play()` returns a promise that resolves when the animation finishes, is stopped, or skipped.
- **Pure numeric engine** — computes values, delegates rendering to the user via `onUpdate`. No implicit target mutation.
- **Ticker-sync friendly** — supports `requestAnimationFrame` auto-ticking or manual updates for game loops.
- **Two levels of time** — `animate({ keyframes })` describes *what a single value does over time*. `createTimeline({ keyframes })` describes *which tweens run when*. Both use the same `keyframes` structure with `at`/`gap` timing.
- **No GC pressure** — zero object allocations in the hot update loop.

---

## 2. Core Concepts

| Concept         | Description |
|-----------------|-------------|
| **Tween**       | Animates a single numeric value from a start to an end over a duration with easing. |
| **Timeline**    | Orchestrates multiple animations in time — parallel groups, consecutive steps, offsets. |
| **Spring**      | Physics-based animation (mass, stiffness, damping). No duration — settles naturally. |
| **Smooth Damp** | Continuous chase with Unity-style `smoothTime` parameter. Reads functions every frame. |
| **Lerp**        | Thin wrapper around smooth damp with a simple `rate` parameter. |
| **Ticker**      | Drives all active animations via `requestAnimationFrame` or manual `update()` calls. |
| **Easing**      | A function that maps linear time `[0, 1]` to a curved progression `[0, 1]`. |

---

## 3. API Surface

### 3.1 `animate()` — Single Tween

The primary entry point. Animates a single numeric value.

```ts
import { animate } from "anim-engine";

const tween = animate({
  from: () => mesh.position.x,    // dynamic start (evaluated at play)
  to: 100,                        // static end
  durationMs: 1000,
  ease: "outQuart",
  onUpdate: (value, velocity) => {
    mesh.position.x = value;
  },
});

await tween.play();
```

Both `from` and `to` accept `number | (() => number)`. Functions are evaluated at:
- `.play()` call
- Each repeat iteration
- A yoyo reversal
- When the user sets `tween.from = ...` or `tween.to = ...`

### 3.2 `animate()` — Keyframes

For multi-step value animation, pass a `keyframes` array instead of discrete `from`/`to`:

```ts
animate({
  keyframes: [
    { at: 0,    value: 0 },
    { at: 500,  value: 100, ease: "outQuart" },
    { at: 1200, value: 50,  ease: "outElastic" },
  ],
  onUpdate: (v) => { mesh.position.x = v; },
});
```

Each keyframe specifies:
- `at` — absolute time in milliseconds from the start of the animation
- `value` — the target value at that point (`number | (() => number)`)
- `ease` — easing to use from the previous keyframe to this one (optional, defaults to `"inOutSine"`)

The animation interpolates between consecutive keyframes using the easing of the *upcoming* keyframe. The `from` value of the first keyframe is the starting value; if omitted, it defaults to `0`.

`from`/`to` and `keyframes` are mutually exclusive — use one or the other, never both.

`animate()` is **single-value only**. For multiple properties, compose parallel tweens with `createTimeline()`:

```ts
createTimeline({
  keyframes: [
    { at: 0, animations: [
      animate({ from: () => mesh.x, to: 100, onUpdate: (v) => { mesh.x = v; } }),
      animate({ from: () => mesh.y, to: 200, onUpdate: (v) => { mesh.y = v; } }),
    ]},
  ],
}).play();
```

**When functions are evaluated:**
- When `.play()` is called
- At the start of each repeat iteration
- At a yoyo reversal
- When the user explicitly sets via `tween.from = ...` or `tween.to = ...`

This gives the user full control over timing — they decide when values are captured by deciding when to trigger these events.

**Delay behaviour:** When `delayMs > 0`, `play()` is called and status becomes `"playing"`, but `onUpdate` does not fire until the delay elapses. The animation is registered with the ticker during delay — it's just counting down silently. The overall duration for the promise is `delayMs + durationMs`.

### 3.3 Tween Options

`animate()` accepts two mutually exclusive modes:

#### Single-tween mode

| Option          | Type                                      | Default       | Description |
|-----------------|-------------------------------------------|---------------|-------------|
| `from`          | `number \| (() => number)`                | `0`           | Start value. |
| `to`            | `number \| (() => number)`                | —             | End value. **Required.** |
| `durationMs`    | `number`                                  | `1000`        | Duration in milliseconds. |
| `ease`          | `EaseName \| EaseFunction`                | `"inOutSine"` | Easing function for this step. |
| `delayMs`       | `number`                                  | `0`           | Delay before playback starts. |
| `repeat`        | `number`                                  | `0`           | Additional repeats. |
| `yoyo`          | `boolean`                                 | `false`       | Alternate direction on repeat. |
| `onStarted`     | `(value) => void`                         | —             | Called when playback begins. |
| `onUpdate`      | `(value, velocity) => void`               | —             | Called every frame. |
| `onEnded`       | `(value) => void`                         | —             | Called on natural completion. |
| `onRepeat`      | `(value) => void`                         | —             | Called at each repeat start. |

#### Keyframe mode

| Option          | Type                                      | Default       | Description |
|-----------------|-------------------------------------------|---------------|-------------|
| `keyframes`     | `Keyframe[]`                              | —             | Array of keyframes. **Required.** |
| `onUpdate`      | `(value, velocity) => void`               | —             | Called every frame. |
| `onEnded`       | `(value) => void`                         | —             | Called on natural completion. |

Each keyframe:

| Property  | Type                        | Default       | Description |
|-----------|-----------------------------|---------------|-------------|
| `at`      | `number`                    | —             | Absolute time in ms from start. **Required.** |
| `value`   | `number \| (() => number)`  | —             | Target value at this point. **Required.** |
| `ease`    | `EaseName \| EaseFunction`  | `"inOutSine"` | Easing from previous keyframe to this one. |

### 3.4 Control Interfaces

There are **two control interfaces** — one for timed primitives (tween, timeline, spring) and one for continuous primitives (smooth damp, lerp).

#### Timed Controls — `AnimControls<T>`

For tweens, timelines, and springs:

```ts
type AnimControls<T> = {
  // Lifecycle
  play: () => Promise<AnimControls<T>>;  // Start or restart.
  pause: () => void;                     // Pause at current position.
  resume: () => void;                    // Resume from paused position.
  stop: () => void;                      // Stop at current position.
  skipToEnd: () => void;                 // Jump to end value immediately.
  kill: () => void;                      // Destroy, remove from ticker.

  // Mutation
  from: DynamicValue<T>;                 // setter
  to: DynamicValue<T>;                   // setter
  ease: EaseName | EaseFunction;         // setter
  setCurrent: (value: T) => void;        // Snap internal state.

  // Query
  currentValue: T;
  velocity: T;
  progress: number;
  status: Status;
  getDurationMs: () => number;
};
```

Where `Status = "playing" | "paused" | "stopped" | "dead"`.

#### Continuous Controls — `ContinuousControls<T>`

For smooth damp and lerp (no duration, no completion):

```ts
type ContinuousControls<T> = {
  start: () => void;                    // Register with ticker.
  stop: () => void;                     // Deactivate from ticker.
  kill: () => void;                     // Destroy, remove from ticker.

  setCurrent: (value: T) => void;       // Snap internal state.

  currentValue: T;
  velocity: T;
  status: "active" | "inactive" | "dead";
};
```

Continuous primitives register with the ticker on creation and chase until `stop()` or `kill()`.

### 3.5 Timeline — `createTimeline()`

Orchestrates multiple independent tweens (or other primitives) in time. Uses the same `keyframes` structure as `animate()`, but instead of `value` each keyframe has `animations` — pre-built tweens that run in parallel during that step.

```ts
import { animate, createTimeline } from "anim-engine";

const moveToDoor = animate({ /* ... */ });
const openDoor = animate({ /* ... */ });
const fadeIn = animate({ /* ... */ });

const timeline = createTimeline({
  keyframes: [
    // Absolute: starts at time 0
    { at: 0,    animations: [moveToDoor, fadeIn] },
    // Relative: starts 500ms after the previous step ends
    { gap: 500, animations: [openDoor] },
    // Relative: overlaps previous step by 200ms (negative gap)
    { gap: -200, animations: [walkThrough] },
    // Absolute: independent of previous timing
    { at: 5000, animations: [outro] },
  ],
  onStarted: () => console.log("started"),
  onEnded: () => console.log("done"),
});

await timeline.play();
```

#### Keyframe timing

Each keyframe uses either `at` (absolute) or `gap` (relative to previous step's end):

| Property       | Type                        | Default | Description |
|----------------|-----------------------------|---------|-------------|
| `at`           | `number`                    | —       | Absolute time in ms from timeline start. |
| `gap`          | `number`                    | —       | Gap after previous step ends. Positive = wait, negative = overlap. |
| `animations`   | `AnimControls<number>[]`    | —       | Tweens to play in parallel during this step. **Required.** |

Use `at` for exact positioning (independent of other steps). Use `gap` for sequential or overlapping timing (relative to previous).

#### Timeline Controls

The returned timeline matches `AnimControls` for lifecycle, but value-related properties (`currentValue`, `velocity`, `from`, `to`, `ease`, `setCurrent`) are not applicable.

```ts
await timeline.play();
timeline.pause();
timeline.resume();
timeline.stop();
timeline.skipToEnd();
timeline.kill();
timeline.progress;        // 0–1 global progress
timeline.getDurationMs(); // total duration
timeline.status;          // "playing" | "paused" | "stopped" | "dead"
```

No `onUpdate` at the timeline level — each animation carries its own callback.

### 3.6 Spring

Physics-based animation. No duration — settles based on stiffness, damping, and mass.

```ts
const spring = createSpring({
  from: () => mesh.position.x,
  to: 100,
  stiffness: 100,
  damping: 10,
  mass: 1,
  precision: 0.01,            // resting threshold
  onUpdate: (value, velocity) => {
    mesh.position.x = value;
  },
});

await spring.play();
```

Spring API mirrors `AnimControls` with these differences:
- No `durationMs`, `ease`, or `progress` — springs are non-linear.
- `progress` getter estimates completion based on resting threshold.
- `skipToEnd()` settles at the target immediately.
- `setCurrent(value)` snaps internal position and resets velocity (useful for mid-animation teleports).
- Springs can be composed into timelines like any other primitive.

### 3.7 Smooth Damp

Continuous chase with Unity-style smooth damp tuning. Reads `from` and `to` as functions **every frame** (no capture at boundaries).

```ts
import { createSmoothDamp } from "anim-engine";

const chase = createSmoothDamp({
  from: () => mesh.position.x,       // reads current position every frame
  to: () => getMousePosition().x,    // reads target every frame — continuous chase
  smoothTime: 0.3,                    // approximate time to settle (seconds)
  maxSpeed: 500,                      // optional speed cap
  onUpdate: (v) => { mesh.position.x = v; },
});

// Override the internal simulation state
chase.setCurrent(500);                // snap to 500, reset velocity

// Clean up
chase.kill();
```

Smooth damp has no `play()`, `pause()`, `progress`, or `getDurationMs()` — it runs continuously, chasing its target. Use `stop()` to pause chasing, `start()` to resume, and `kill()` to destroy.

### 3.8 Lerp (helper)

Lerp is a thin wrapper around smooth damp with a simpler interface:

```ts
import { createLerp } from "anim-engine";

const lerp = createLerp({
  from: () => mesh.position.x,
  to: () => getMousePosition().x,
  rate: 0.1,                  // interpolation factor per frame (0–1)
  onUpdate: (v) => { mesh.position.x = v; },
});

lerp.setCurrent(500);
```

Same lifecycle as smooth damp — registers with ticker on creation, `stop()` to pause, `start()` to resume, `kill()` to destroy. `rate` is converted internally to equivalent smooth damp parameters.

---

## 4. Easing

### 4.1 Named Easing Functions

All 31 standard named easings:

| Type       | Functions |
|------------|-----------|
| Linear     | `linear` |
| Quad       | `inQuad`, `outQuad`, `inOutQuad` |
| Cubic      | `inCubic`, `outCubic`, `inOutCubic` |
| Quart      | `inQuart`, `outQuart`, `inOutQuart` |
| Quint      | `inQuint`, `outQuint`, `inOutQuint` |
| Sine       | `inSine`, `outSine`, `inOutSine` |
| Expo       | `inExpo`, `outExpo`, `inOutExpo` |
| Circ       | `inCirc`, `outCirc`, `inOutCirc` |
| Back       | `inBack`, `outBack`, `inOutBack` |
| Elastic    | `inElastic`, `outElastic`, `inOutElastic` |
| Bounce     | `inBounce`, `outBounce`, `inOutBounce` |

### 4.2 Custom Easing

```ts
animate({
  to: 100,
  ease: (t) => t * t,                       // custom function
  ease: cubicBezier(0.42, 0, 0.58, 1),     // cubic-bezier
});
```

---

## 5. Ticker

The ticker drives all active animations. It accepts `deltaMs` directly — no timestamp tracking.

```ts
import { getTicker } from "anim-engine";

const ticker = getTicker();

// Auto-rAF: start the loop
ticker.start();

// Manual: drive from your game loop
ticker.update(16.67);   // 60fps

// Stop the rAF loop (animations remain registered)
ticker.stop();
```

**Key behaviours:**
- Does **not** auto-start. `add()`/`remove()` register/unregister animations without side effects.
- `ticker.start()` — begins the `requestAnimationFrame` loop. Runs until `stop()` is called.
- `ticker.stop()` — cancels the rAF loop. Animations remain registered.
- `ticker.update(deltaMs)` — advance all active animations by `deltaMs` milliseconds.
- Singleton by default (`getTicker()`), but can create custom instances with `createTicker()`.

The decision to pass `deltaMs` (not a timestamp) means the user's game loop is the source of truth for time — no double delta calculation.

### Drive modes

| Mode | How | Use case |
|------|-----|----------|
| **Auto-rAF** | Call `ticker.start()` once. Runs its own `requestAnimationFrame` loop. | DOM demos, simple pages |
| **Manual** | Call `ticker.update(deltaMs)` from your own game loop. | ThreeJS, PixiJS, custom game loops |

---

## 6. Status State Machine

### Timed primitives (tween, timeline, spring)

```
          play()
  STOPPED ──────► PLAYING
    ▲                │
    │  stop()        │ pause()
    │    skipToEnd() │
    │                ▼
    │            PAUSED
    │                │
    │                │ resume()
    │                ▼
    │            PLAYING  ◄── (on repeat)
    │                │
    │       natural  │ kill()
    │       end      │
    │                ▼
    └────────────  DEAD  (can't be resurrected)
```

| Status   | Can play? | Can pause? | Can resume? | Can stop? | Can kill? |
|----------|-----------|------------|-------------|-----------|-----------|
| stopped  | Yes       | No         | No          | No        | Yes       |
| playing  | No        | Yes        | No          | Yes       | Yes       |
| paused   | No        | No         | Yes         | No        | Yes       |
| dead     | No        | No         | No          | No        | No        |

---

## 7. Advanced Features (Post-v1)

Features for future releases, not part of the initial API:

- Color interpolation (hex, RGB, HSL)
- SVG path following
- Arrays of values
- Custom cubic bezier curve utility
- Custom interpolator registry (`addInterpolator`)
- `pauseBefore` step markers on timelines
- Debug/visualization tools

---

## 8. Internal Architecture

### 8.1 Implementation Style — Functions, not classes

All primitives are factory functions that capture state in closures. No `class` or `this`.

```ts
// Pattern: factory function returning a plain object
// All methods are arrow functions so they can be safely passed around.
const createTween = (options: TweenOptions): AnimControls<number> => {
  let progress = 0;
  let status: Status = "stopped";
  let fromValue: number;
  let toValue: number;

  const ticker = getTicker();

  // The object the ticker calls update() on
  const animationHandle: Updateable = { update };

  const play = (): Promise<AnimControls<number>> => {
    // ...
    ticker.add(animationHandle);
    // All state accessed via closure — no `this`
  };

  const update = (deltaMs: number): void => {
    progress += deltaMs / options.durationMs;
    // ...
  };

  const kill = (): void => {
    status = "dead";
    ticker.remove(animationHandle);
  };

  return { play, pause, resume, stop, skipToEnd, kill, /* ... */ };
};
```

Benefits:
- No `this` at all — all state in closure
- Arrow functions can be destructured and passed as callbacks safely
- Private by default (closure variables)
- Tree-shake friendly
- No class inheritance or `instanceof` concerns

### 8.2 Module Structure

Domain-organized — groups by primitive rather than by file type. Each domain owns its public API and internal logic.

```
anim-engine/
├── tween/
│   ├── create-tween.ts     # animate() factory — single-value only
│   └── update.ts           # Frame update math (progress, easing, value, velocity)
├── timeline/
│   └── create-timeline.ts  # createTimeline() factory
├── spring/
│   ├── create-spring.ts    # createSpring() factory
│   └── verlet.ts           # Verlet integration
├── smooth-damp/
│   ├── create-smooth-damp.ts # createSmoothDamp() factory
│   └── step.ts             # Unity-style smooth damp math
├── lerp/
│   └── create-lerp.ts      # createLerp() — thin wrapper around smooth damp
├── easing/
│   └── easing.ts           # All 31 easing functions + cubic-bezier stub
├── ticker/
│   ├── ticker.ts           # Ticker implementation
│   └── get-ticker.ts       # Singleton + createTicker()
├── shared/
│   ├── types.ts            # Public types (EaseName, Status, AnimControls, etc.)
│   ├── signal.ts           # Stop/skip signal helpers (shared by tween, spring, timeline)
│   └── internal.ts         # Internal types (Updateable, etc.)
└── index.ts                # Public API barrel
```

### 8.3 Data Flow (per frame)

```
ticker.update(deltaMs)              ← user's game loop provides delta directly
    │
    ▼
For each active animation:
    │
    ▼
animation.update(deltaMs)         ← delta passed straight through
    │
    ├─ [Tween]───────────────────────────────────────
    │  ├─ Time: progress += deltaMs / durationMs, clamp to [0, 1]
    │  ├─ Easing: eased = easeFunction(progress)
    │  ├─ Value: current = from + (to - from) * eased
    │  ├─ Velocity: current - previousValue
    │  └─ onUpdate(currentValue, velocity)
    │
    ├─ [Spring]──────────────────────────────────────
    │  ├─ Verlet step:
    │  │    velocity += (to - current) * stiffness - velocity * damping
    │  │    velocity *= mass
    │  │    current += velocity * deltaMs / 1000
    │  ├─ Check rest threshold: if near rest, settle
    │  └─ onUpdate(currentValue, velocity)
    │
    ├─ [Smooth Damp / Lerp]──────────────────────────
    │  ├─ Read from/to from functions (every frame)
    │  ├─ Smooth damp step (Unity-style):
    │  │    omega = 2 / smoothTime
    │  │    x = omega * deltaMs / 1000
    │  │    exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
    │  │    change = (current - to) + velocity * deltaMs / 1000
    │  │    velocity = (velocity - omega * change) * exp
    │  │    current = to + change * exp
    │  └─ onUpdate(currentValue, velocity)
    │
    ▼
Completion check:
    ├─ [Tween]: progress >= 1 → repeat/yoyo/end
    ├─ [Spring]: near rest and velocity near 0 → settle, resolve promise
    └─ [Smooth Damp / Lerp]: never completes — continuous
```

No allocations in the hot loop. All state is local variables in closures — mutated in place.

The user's game loop owns time. `ticker.update(deltaMs)` is a simple fan-out — no timestamp arithmetic, no last-time tracking.

### 8.4 Signal Architecture

Replace AbortController with a simple `stopped` boolean flag at factory scope:

```ts
const createTween = (options: TweenOptions): AnimControls<number> => {
  let stopped = false;
  let stopResolver: (() => void) | null = null;

  const play = (): Promise<AnimControls<number>> => {
    stopped = false;                          // reset for this play() call
    return new Promise((resolve) => {
      stopResolver = resolve;
      // ... register with ticker, start updating
    });
  };

  const stop = () => {
    stopped = true;
    stopResolver?.();                         // resolve the play() promise
    stopResolver = null;
  };

  const update = (deltaMs: number) => {
    if (stopped) return;                      // bail immediately
    // ... compute progress, value, velocity
  };

  return { play, pause, resume, stop, skipToEnd, kill, /* ... */ };
};
```

The `stopped` flag lives at factory scope so both `play()` and `stop()` can access it. Each `play()` call resets it. No event listeners, no AbortController, no cleanup needed. The promise is resolved directly from `stop()` via a stored resolver.

---

## 9. TypeScript Types

```ts
// === Shared ===

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
  | "inBounce" | "outBounce" | "inOutBounce";

type EaseFunction = (t: number) => number;

type Status = "playing" | "paused" | "stopped" | "dead";

type DynamicValue<T> = T | (() => T);

// === AnimControls (tween, timeline, spring) ===

type AnimControls<T> = {
  play: () => Promise<AnimControls<T>>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipToEnd: () => void;
  kill: () => void;

  from: DynamicValue<T>;
  to: DynamicValue<T>;
  ease: EaseName | EaseFunction;
  setCurrent: (value: T) => void;

  currentValue: T;
  velocity: T;
  progress: number;
  status: Status;
  getDurationMs: () => number;
};

// === ContinuousControls (smooth damp, lerp) ===

type ContinuousControls<T> = {
  start: () => void;
  stop: () => void;
  kill: () => void;

  setCurrent: (value: T) => void;

  currentValue: T;
  velocity: T;
  status: "active" | "inactive" | "dead";
};

// === TweenOptions (single-tween mode) ===

type SingleTweenOptions = {
  from?: DynamicValue<number>;
  to: DynamicValue<number>;
  durationMs?: number;
  ease?: EaseName | EaseFunction;
  delayMs?: number;
  repeat?: number;
  yoyo?: boolean;
  onStarted?: (value: number) => void;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: (value: number) => void;
  onRepeat?: (value: number) => void;
};

// === KeyframeOptions (keyframe mode) ===

type Keyframe = {
  at: number;
  value: DynamicValue<number>;
  ease?: EaseName | EaseFunction;
};

type KeyframeOptions = {
  keyframes: Keyframe[];
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: (value: number) => void;
};

// `animate()` accepts either single-tween or keyframe mode (mutually exclusive)
type AnimateOptions = SingleTweenOptions | KeyframeOptions;

// === Timeline ===

type TimelineKeyframe = {
  at?: number;                         // absolute time (alternative to gap)
  gap?: number;                        // relative to previous step end (alternative to at)
  animations: AnimControls<number>[];  // tweens to run in parallel
};

type TimelineOptions = {
  keyframes: TimelineKeyframe[];
  onStarted?: () => void;
  onEnded?: () => void;
};

// === SpringOptions ===

type SpringOptions = {
  from?: DynamicValue<number>;
  to: DynamicValue<number>;
  stiffness?: number;       // default 100
  damping?: number;          // default 10
  mass?: number;             // default 1
  precision?: number;        // default 0.01
  onStarted?: (value: number) => void;
  onUpdate?: (value: number, velocity: number) => void;
  onEnded?: (value: number) => void;
};

// === SmoothDampOptions ===

type SmoothDampOptions = {
  from: () => number;              // read every frame
  to: () => number;                // read every frame
  smoothTime: number;              // approximate time to settle (seconds)
  maxSpeed?: number;               // optional speed cap
  onUpdate: (value: number, velocity: number) => void;
};

// === LerpOptions ===

type LerpOptions = {
  from: () => number;              // read every frame
  to: () => number;                // read every frame
  rate: number;                    // 0–1, interpolation factor per frame
  onUpdate: (value: number) => void;
};

// === TickerControls ===

type TickerControls = {
  start: () => void;
  stop: () => void;
  update: (deltaMs: number) => void;
  add: (anim: { update: (deltaMs: number) => void }) => void;
  remove: (anim: { update: (deltaMs: number) => void }) => void;
};
```

---

## 10. Code Review Summary (from existing codebase)

### Structural Issues

| Issue | Severity |
|-------|----------|
| Duplicate easing functions in `tween-machine/` and `anim-engine/` | **High** |
| Duplicate ticker implementations | **High** |
| Cross-module dependency (`tween-machine` imports from `anim-engine`) | **High** |
| Two parallel API surfaces causing confusion | **High** |
| Config exports `tween-machine`, demo uses `anim-engine` | **Medium** |

### Bugs

| Bug | Severity |
|-----|----------|
| Repeat counter logic inverted (`#repeatNumber < #repeatCounter`) | **High** |
| `play()` promise can resolve twice (skip + stop both fire) | **Medium** |
| Sequence progress getter/setter is TODO stubbed | **Medium** |
| Tween interface missing `kill()` | **Medium** |

### Complete rewrite required

The existing code is class-based (`class AnimEngine`, `class TweenImplementation`, etc.). The new spec calls for function-based factories with closure state. Combined with the API changes (no target mutation, timeline chain API, pure `onUpdate`), the cleanest path is a complete rewrite. The existing easing functions, ticker architecture, and test patterns serve as reference material.

---

## 11. Phased Build Plan

### Phase 1: Core Tween
- [ ] `animate()` — single-value only (number)
- [ ] `from`/`to` as `number | (() => number)`
- [ ] 31 easing functions
- [ ] Ticker (singleton, rAF + manual mode)
- [ ] Full lifecycle: play, pause, resume, stop, skipToEnd, kill
- [ ] Promise-based resolution
- [ ] Zero allocations in hot loop
- [ ] Test: lifecycle, easing, dynamic values, ticker sync

### Phase 2: Repeat, Yoyo, Delay
- [ ] `repeat` + `yoyo` support
- [ ] `delayMs` support
- [ ] `onRepeat` callback
- [ ] Test: all repeat scenarios

### Phase 3: Keyframes + Timeline
- [ ] `animate({ keyframes: [...] })` — value keyframes with `at` and `value`
- [ ] `createTimeline({ keyframes: [...] })` — animation keyframes with `at`/`gap` and `animations`
- [ ] Timeline lifecycle (play, pause, resume, stop, skipToEnd, kill)
- [ ] Test: single-tween, keyframes, timeline keyframes with at/gap, parallel, nested kill

### Phase 4: Spring + Smooth Damp + Lerp
- [ ] `createSpring()` with Verlet integration
- [ ] `createSmoothDamp()` with Unity-style smoothTime
- [ ] `createLerp()` as smooth damp wrapper
- [ ] Spring lifecycle (play, stop, skipToEnd, kill)
- [ ] Smooth damp lifecycle (start, stop, setCurrent, kill)
- [ ] All composable in timelines
- [ ] Test: settling, precision, overshoot, damping, target changes

### Phase 5: Polish
- [ ] Custom cubic bezier easing
- [ ] Tree-shake verification
- [ ] Full TypeScript export types
- [ ] Documentation with examples (DOM, ThreeJS, PixiJS)
- [ ] NPM publish

---

## 12. Examples

### Game loop sync

```ts
import { animate, getTicker } from "anim-engine";

const ticker = getTicker();

const tween = animate({
  from: () => player.health,
  to: 0,
  durationMs: 500,
  ease: "inQuad",
  onUpdate: (v) => { player.health = v; },
});

tween.play();

// In your game loop (delta in ms):
let last = performance.now();
const gameLoop = (now: number) => {
  const delta = now - last;
  last = now;
  ticker.update(delta);
  requestAnimationFrame(gameLoop);
};
requestAnimationFrame(gameLoop);
```

### Keyframe animation

```ts
import { animate } from "anim-engine";

await animate({
  keyframes: [
    { at: 0,    value: 0 },
    { at: 500,  value: 100, ease: "outQuart" },
    { at: 800,  value: 200, ease: "outElastic" },
    { at: 1200, value: 50,  ease: "outBounce" },
  ],
  onUpdate: (v) => { mesh.position.x = v; },
}).play();
```

### Complex scene orchestration

```ts
import { animate, createTimeline, createSpring } from "anim-engine";

const slideIn = animate({
  from: () => panel.x,
  to: 0,
  durationMs: 400,
  ease: "outBack",
  onUpdate: (v) => { panel.x = v; },
});

const fadeIn = animate({
  from: 0,
  to: 1,
  durationMs: 200,
  onUpdate: (v) => { panel.style.opacity = v; },
});

const bounce = createSpring({
  from: () => icon.scale,
  to: 1,
  stiffness: 200,
  damping: 8,
  onUpdate: (v) => { icon.scale = v; },
});

await createTimeline({
  keyframes: [
    { at: 0, animations: [slideIn, fadeIn] },
    { gap: -100, animations: [bounce] },
  ],
}).play();

console.log("Scene complete");
```

### SolidJS integration

```ts
import { animate } from "anim-engine";
import { createSignal, createEffect, onCleanup } from "solid-js";

const [position, setPosition] = createSignal(0);

const tween = animate({
  from: position,
  to: 100,
  durationMs: 500,
  onUpdate: (v) => setPosition(v),
  onEnded: () => console.log("done"),
});

button.onclick = () => tween.play();
onCleanup(() => tween.kill());
```

---

*This specification is a living document. As the library evolves, this document should be updated to reflect the current design and future direction.*
