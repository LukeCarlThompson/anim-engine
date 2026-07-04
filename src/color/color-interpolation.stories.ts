import type { Meta, StoryObj } from "@storybook/html-vite";

import { createAnimation } from "../animation/create-animation";
import type { Animation } from "../shared/types";
import { getTicker } from "../ticker/get-ticker";
import { lerpOklab, hexToRgba } from "./lerp-oklab";

getTicker().start();

const meta = {
  title: "Color Interpolation (Oklab)",
  argTypes: {
    fromHex: { control: "color" },
    toHex: { control: "color" },
    durationMs: { control: { type: "range", min: 500, max: 5000, step: 100 } },
  },
  args: {
    fromHex: "#ff6b6b",
    toHex: "#4ecdc4",
    durationMs: 2500,
  },
  render: ({ fromHex, toHex, durationMs }) => {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      gap: 24px; padding: 40px; font-family: sans-serif;
    `;

    // Title
    const title = document.createElement("h2");
    title.textContent = "Oklab Color Lerp";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    // === Main color block ===
    const block = document.createElement("div");
    block.style.cssText = `
      width: 200px; height: 200px; border-radius: 16px;
      background: ${fromHex}; transition: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    container.appendChild(block);

    // Compare row: Oklab vs RGB side by side
    const compareRow = document.createElement("div");
    compareRow.style.cssText = `
      display: flex; gap: 32px; align-items: center; justify-content: center;
      width: 600px;
    `;

    const makeSwatch = (label: string, color: string) => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:8px;";

      const swatch = document.createElement("div");
      swatch.style.cssText = `
        width: 100px; height: 100px; border-radius: 12px;
        background: ${color}; transition: none;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      `;

      const labelEl = document.createElement("div");
      labelEl.textContent = label;
      labelEl.style.cssText = "color:#888;font-size:12px;font-family:monospace;";

      wrapper.appendChild(swatch);
      wrapper.appendChild(labelEl);
      return { wrapper, swatch };
    };

    const oklabSwatch = makeSwatch("Oklab", fromHex);
    const rgbSwatch = makeSwatch("RGB (linear)", fromHex);
    compareRow.appendChild(oklabSwatch.wrapper);
    compareRow.appendChild(rgbSwatch.wrapper);
    container.appendChild(compareRow);

    // === Gradient bar showing the full curve ===
    const gradientBar = document.createElement("div");
    gradientBar.style.cssText = `
      width: 600px; height: 40px; border-radius: 8px; overflow: hidden;
      display: flex;
    `;

    const steps = 60;
    const fromParsed = hexToRgba(fromHex);
    const toParsed = hexToRgba(toHex);

    // Oklab gradient
    const oklabBar = document.createElement("div");
    oklabBar.style.cssText = "flex:1;display:flex;flex-direction:column;";
    const oklabGradient = document.createElement("div");
    oklabGradient.style.cssText = "flex:1;display:flex;";
    for (let i = 0; i < steps; i++) {
      const [r, g, b] = lerpOklab(fromParsed, toParsed, i / (steps - 1));
      const seg = document.createElement("div");
      seg.style.cssText = `flex:1;background:rgb(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0});`;
      oklabGradient.appendChild(seg);
    }
    const oklabLabel = document.createElement("div");
    oklabLabel.textContent = "Oklab";
    oklabLabel.style.cssText =
      "color:#666;font-size:11px;font-family:monospace;text-align:center;padding-top:2px;";
    oklabBar.appendChild(oklabGradient);
    oklabBar.appendChild(oklabLabel);
    gradientBar.appendChild(oklabBar);

    // RGB gradient
    const rgbGradientBar = document.createElement("div");
    rgbGradientBar.style.cssText = "flex:1;display:flex;flex-direction:column;";
    const rgbGradient = document.createElement("div");
    rgbGradient.style.cssText = "flex:1;display:flex;";
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = fromParsed[0] + (toParsed[0] - fromParsed[0]) * t;
      const g = fromParsed[1] + (toParsed[1] - fromParsed[1]) * t;
      const b = fromParsed[2] + (toParsed[2] - fromParsed[2]) * t;
      const seg = document.createElement("div");
      seg.style.cssText = `flex:1;background:rgb(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0});`;
      rgbGradient.appendChild(seg);
    }
    const rgbLabel = document.createElement("div");
    rgbLabel.textContent = "RGB (linear)";
    rgbLabel.style.cssText =
      "color:#666;font-size:11px;font-family:monospace;text-align:center;padding-top:2px;";
    rgbGradientBar.appendChild(rgbGradient);
    rgbGradientBar.appendChild(rgbLabel);
    gradientBar.appendChild(rgbGradientBar);

    container.appendChild(gradientBar);

    // === Color value display ===
    const display = document.createElement("div");
    display.style.cssText = `
      display: flex; gap: 32px; align-items: center; justify-content: center;
      font-family: monospace; font-size: 13px; color: #aaa;
    `;

    const fromDisplay = document.createElement("div");
    fromDisplay.textContent = `From: ${fromHex}`;
    fromDisplay.style.cssText = `color:${fromHex};font-family:monospace;font-size:13px;`;

    const midDisplay = document.createElement("div");
    midDisplay.textContent = "Mid: —";
    midDisplay.style.cssText = `color:${fromHex};`;

    const toDisplay = document.createElement("div");
    toDisplay.textContent = `To: ${toHex}`;
    toDisplay.style.cssText = `color:${toHex};font-family:monospace;font-size:13px;`;

    display.appendChild(fromDisplay);
    display.appendChild(midDisplay);
    display.appendChild(toDisplay);

    // Scrubber slider — draggable to manually set progress
    const scrubberRow = document.createElement("div");
    scrubberRow.style.cssText = "display:flex;align-items:center;gap:10px;width:600px;";

    const scrubLabel = document.createElement("span");
    scrubLabel.textContent = "Pos";
    scrubLabel.style.cssText = "color:#888;font-size:13px;font-family:monospace;min-width:28px;";

    const scrubInput = document.createElement("input");
    scrubInput.type = "range";
    scrubInput.min = "0";
    scrubInput.max = "100";
    scrubInput.step = "0.5";
    scrubInput.value = "0";
    scrubInput.style.cssText = "flex:1;accent-color:#667eea;";

    const scrubVal = document.createElement("span");
    scrubVal.textContent = "0%";
    scrubVal.style.cssText =
      "color:#a8e063;font-size:13px;font-family:monospace;min-width:42px;text-align:right;";

    scrubberRow.appendChild(scrubLabel);
    scrubberRow.appendChild(scrubInput);
    scrubberRow.appendChild(scrubVal);

    const displayRow = document.createElement("div");
    displayRow.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:8px;width:600px;";
    displayRow.appendChild(display);
    displayRow.appendChild(scrubberRow);
    container.appendChild(displayRow);

    // === Sliders for live color editing ===
    const pickerRow = document.createElement("div");
    pickerRow.style.cssText = `
      display: flex; gap: 24px; align-items: center; justify-content: center;
      width: 600px;
    `;

    const makeColorInput = (label: string, initial: string, onChange: (hex: string) => void) => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display:flex;align-items:center;gap:8px;";

      const lbl = document.createElement("span");
      lbl.textContent = label;
      lbl.style.cssText = "color:#888;font-size:13px;font-family:monospace;min-width:36px;";

      const input = document.createElement("input");
      input.type = "color";
      input.value = initial;
      input.style.cssText =
        "width:40px;height:40px;border:none;border-radius:6px;cursor:pointer;background:none;padding:0;";

      const hexDisplay = document.createElement("span");
      hexDisplay.textContent = initial;
      hexDisplay.style.cssText = "color:#aaa;font-size:12px;font-family:monospace;min-width:70px;";

      input.addEventListener("input", () => {
        hexDisplay.textContent = input.value;
        onChange(input.value);
      });

      wrapper.appendChild(lbl);
      wrapper.appendChild(input);
      wrapper.appendChild(hexDisplay);
      return wrapper;
    };

    let currentFromHex = fromHex;
    let currentToHex = toHex;

    const updateGradients = () => {
      const f = hexToRgba(currentFromHex);
      const t = hexToRgba(currentToHex);
      const children = oklabGradient.children;
      for (let i = 0; i < steps && i < children.length; i++) {
        const [r, g, b] = lerpOklab(f, t, i / (steps - 1));
        (children[i] as HTMLElement).style.background =
          `rgb(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0})`;
      }
      for (let i = 0; i < steps && i < rgbGradient.children.length; i++) {
        const p = i / (steps - 1);
        const r = f[0] + (t[0] - f[0]) * p;
        const g = f[1] + (t[1] - f[1]) * p;
        const b = f[2] + (t[2] - f[2]) * p;
        (rgbGradient.children[i] as HTMLElement).style.background =
          `rgb(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0})`;
      }
      fromDisplay.textContent = `From: ${currentFromHex}`;
      toDisplay.textContent = `To: ${currentToHex}`;
    };

    const fromPicker = makeColorInput("From", fromHex, (hex) => {
      currentFromHex = hex;
      fromDisplay.textContent = `From: ${hex}`;
      fromDisplay.style.color = hex;
      updateGradients();
      applyColor(0);
      if (anim) {
        anim.kill();
        anim = null;
      }
      playBtn.textContent = "▶ Play";
    });
    const toPicker = makeColorInput("To", toHex, (hex) => {
      currentToHex = hex;
      toDisplay.textContent = `To: ${hex}`;
      toDisplay.style.color = hex;
      updateGradients();
      applyColor(0);
      if (anim) {
        anim.kill();
        anim = null;
      }
      playBtn.textContent = "▶ Play";
    });

    pickerRow.appendChild(fromPicker);
    pickerRow.appendChild(toPicker);
    container.appendChild(pickerRow);

    // === Duration slider ===
    const durationRow = document.createElement("div");
    durationRow.style.cssText = "display:flex;align-items:center;gap:10px;width:600px;";

    const durLabel = document.createElement("span");
    durLabel.textContent = "Dur";
    durLabel.style.cssText = "color:#888;font-size:13px;font-family:monospace;min-width:28px;";

    const durInput = document.createElement("input");
    durInput.type = "range";
    durInput.min = "500";
    durInput.max = "5000";
    durInput.step = "100";
    durInput.value = String(durationMs);
    durInput.style.cssText = "flex:1;accent-color:#667eea;";

    const durVal = document.createElement("span");
    durVal.textContent = `${durationMs}ms`;
    durVal.style.cssText =
      "color:#a8e063;font-size:13px;font-family:monospace;min-width:50px;text-align:right;";

    let currentDurationMs = durationMs;
    durInput.addEventListener("input", () => {
      currentDurationMs = parseInt(durInput.value);
      durVal.textContent = `${currentDurationMs}ms`;
    });

    durationRow.appendChild(durLabel);
    durationRow.appendChild(durInput);
    durationRow.appendChild(durVal);
    container.appendChild(durationRow);

    // === Controls ===
    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;gap:12px;align-items:center;";

    const playBtn = document.createElement("button");
    playBtn.textContent = "▶ Play";
    playBtn.style.cssText = `
      padding:8px 24px;border:1px solid #667eea;border-radius:6px;
      background:transparent;color:#667eea;cursor:pointer;font-size:14px;min-width:100px;
    `;

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "↺ Reset";
    resetBtn.style.cssText = `
      padding:8px 16px;border:1px solid #555;border-radius:6px;
      background:transparent;color:#888;cursor:pointer;font-size:14px;
    `;

    controls.appendChild(playBtn);
    controls.appendChild(resetBtn);
    container.appendChild(controls);

    let anim: Animation<number> | null = null;

    // Shared function to apply color at a given progress (0–1)
    const applyColor = (progress: number) => {
      const fromColor = hexToRgba(currentFromHex);
      const toColor = hexToRgba(currentToHex);

      // Oklab interpolation
      const [r, g, b, a] = lerpOklab(fromColor, toColor, progress);
      const rgba = `rgba(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0},${a.toFixed(2)})`;
      block.style.background = rgba;
      oklabSwatch.swatch.style.background = rgba;

      // RGB linear interpolation (for comparison)
      const rRgb = fromColor[0] + (toColor[0] - fromColor[0]) * progress;
      const gRgb = fromColor[1] + (toColor[1] - fromColor[1]) * progress;
      const bRgb = fromColor[2] + (toColor[2] - fromColor[2]) * progress;
      rgbSwatch.swatch.style.background = `rgb(${(rRgb * 255) | 0},${(gRgb * 255) | 0},${(bRgb * 255) | 0})`;

      // Show midpoint color value
      const hexStr = `#${[r, g, b]
        .map((c) =>
          Math.round(c * 255)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")}`;
      midDisplay.textContent = `Mid: ${hexStr}`;
      midDisplay.style.color = hexStr;

      const pct = Math.round(progress * 100);
      scrubInput.value = String(pct);
      scrubVal.textContent = `${pct}%`;
    };

    const resetPosition = () => {
      if (anim) {
        anim.kill();
        anim = null;
      }
      applyColor(0);
    };

    // Scrubber drag handler — pauses animation and scrubs manually
    scrubInput.addEventListener("input", () => {
      if (anim) {
        anim.kill();
        anim = null;
        playBtn.textContent = "▶ Play";
      }
      const progress = parseInt(scrubInput.value) / 100;
      applyColor(progress);
    });

    const play = () => {
      if (anim) {
        anim.kill();
      }

      // Start animation from the beginning; scrubber was just for preview
      applyColor(0);

      anim = createAnimation({
        from: 0,
        to: 1,
        durationMs: currentDurationMs,
        ease: "linear",
        onUpdate: (progress) => {
          applyColor(progress);
        },
        onEnded: () => {
          anim = null;
          playBtn.textContent = "▶ Play";
        },
      });

      anim.play();
      playBtn.textContent = "⏸ Pause";
    };

    const togglePlay = () => {
      if (!anim || (anim.status !== "playing" && anim.status !== "paused")) {
        play();
        return;
      }
      if (anim.status === "playing") {
        anim.pause();
        playBtn.textContent = "▶ Resume";
      } else {
        anim.resume();
        playBtn.textContent = "⏸ Pause";
      }
    };

    playBtn.addEventListener("click", togglePlay);
    resetBtn.addEventListener("click", () => {
      if (anim) {
        anim.kill();
        anim = null;
      }
      resetPosition();
      playBtn.textContent = "▶ Play";
    });

    // Draw initial state
    resetPosition();

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
