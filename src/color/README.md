# Color Interpolation (Oklab)

Utilities for perceptually uniform color blending via [Oklab](https://bottosson.github.io/posts/oklab/).

## Why Oklab

Straight RGB lerp produces muddy, dull transitions — red→green goes through brown, blue→yellow goes through grey. Oklab is a color space designed by Björn Ottosson that matches human perception: equal steps in Oklab look like equal steps in color. It's what modern CSS uses under the hood for `color-mix()` and `oklch()`.

## API

### `lerpOklab(from, to, progress)`

Interpolate between two RGBA colors in Oklab space. RGB channels are converted to Oklab, lerped perceptually uniformly, and converted back. Alpha is lerped linearly alongside.

```ts
import { lerpOklab } from "anim-engine";

const from = [1, 0, 0, 1]; // red, opaque
const to = [0, 0, 1, 0.5]; // blue, 50% transparent

const [r, g, b, a] = lerpOklab(from, to, 0.5);
// → R, G, B in 0–1, alpha in 0–1
```

### `hexToRgba(hex)`

Parse a hex color string to a normalized RGBA tuple.

```ts
import { hexToRgba } from "anim-engine";

hexToRgba("#ff8040"); // [1, 0.502, 0.251, 1]
hexToRgba("#ff804080"); // [1, 0.502, 0.251, 0.502]
hexToRgba("#f80"); // [1, 0.533, 0, 1] (shorthand)
hexToRgba("ff8040"); // [1, 0.502, 0.251, 1] (no #)
```

Accepts `#RRGGBB`, `#RRGGBBAA`, `#RGB`, `#RGBA`, with or without leading `#`.

## Common Patterns

### Single transition with easing

Two-color animation with proper easing. The ease function receives the progress (0–1), which becomes the lerp blend factor:

```ts
import { createAnimation, lerpOklab, hexToRgba } from "anim-engine";

const fromColor = hexToRgba("#ff6b6b");
const toColor = hexToRgba("#4ecdc4");

const anim = createAnimation({
  from: 0,
  to: 1,
  durationMs: 2000,
  ease: "outCubic",
  onUpdate: (blend) => {
    const [r, g, b, a] = lerpOklab(fromColor, toColor, blend);
    sprite.setColor(r, g, b, a);
  },
});
```

### Multi-stop sequence via timeline

For three or more colors, compose multiple anim-to-color pairs into a timeline. Each segment has its own color pair and easing:

```ts
import { createAnimation, createTimeline, lerpOklab, hexToRgba } from "anim-engine";

const red = hexToRgba("#ff6b6b");
const green = hexToRgba("#4ecdc4");
const blue = hexToRgba("#6c5ce7");
const yellow = hexToRgba("#ffd93d");

const segment1 = createAnimation({
  from: 0,
  to: 1,
  durationMs: 1000,
  ease: "outCubic",
  onUpdate: (blend) => {
    sprite.setColor(...lerpOklab(red, green, blend), 1);
  },
});

const segment2 = createAnimation({
  from: 0,
  to: 1,
  durationMs: 1000,
  ease: "outCubic",
  onUpdate: (blend) => {
    sprite.setColor(...lerpOklab(green, blue, blend), 1);
  },
});

const segment3 = createAnimation({
  from: 0,
  to: 1,
  durationMs: 1000,
  ease: "outCubic",
  onUpdate: (blend) => {
    sprite.setColor(...lerpOklab(blue, yellow, blend), 1);
  },
});

const timeline = createTimeline(
  [
    { at: 0, animation: segment1 },
    { at: 1000, animation: segment2 },
    { at: 2000, animation: segment3 },
  ],
  {
    onEnded: () => console.log("color cycle complete"),
  },
);

timeline.play();
```

Each segment gets its own easing, duration, and color pair — no manual segment math or `if/then` branching inside the update callback.

### With continuous primitives

`lerpOklab` also works with spring, smooth damp, or lerp — any primitive that drives a value 0–1:

```ts
import { createSpring, lerpOklab, hexToRgba } from "anim-engine";

const fromColor = hexToRgba("#ff6b6b");
const toColor = hexToRgba("#4ecdc4");

const spring = createSpring({
  from: 0,
  to: () => (isHovered ? 1 : 0),
  stiffness: 180,
  damping: 12,
  onUpdate: (blend) => {
    const [r, g, b] = lerpOklab(fromColor, toColor, blend);
    sprite.setColor(r, g, b, 1);
  },
});
```

## How It Works

`lerpOklab` converts both RGB tuples to Oklab via matrix multiplication, lerps the L/a/b channels, then converts back. Alpha stays as a simple linear lerp — it doesn't need perceptual treatment. The conversion is about 30 multiply-adds total — fast enough for every frame.

```
RGBA → linearize sRGB → LMS → cbrt(LMS) → Oklab    (forward)
Oklab → LMS → cube(LMS) → linear RGB → sRGB → RGBA  (inverse)
```
