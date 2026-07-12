import type { Meta, StoryObj } from "@storybook/html-vite";

import { getTicker } from "../ticker";
import { createInertia } from "./create-inertia";

getTicker().start();

const meta = {
  title: "Inertia",
  args: { decelerationMs: 300 },
  argTypes: {
    decelerationMs: { control: { type: "range", min: 50, max: 2000, step: 50 } },
  },
  render: ({ decelerationMs }) => {
    const container = document.createElement("div");
    container.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px;font-family:sans-serif;";

    const title = document.createElement("h2");
    title.textContent = "Inertia — Drag and Throw";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const desc = document.createElement("p");
    desc.textContent =
      "Click and drag the block, then release to throw — coast distance reflects flick speed";
    desc.style.cssText = "margin:0;color:#666;font-size:13px;";
    container.appendChild(desc);

    const track = document.createElement("div");
    track.style.cssText =
      "position:relative;width:700px;height:150px;background:#2a2a3d;border-radius:8px;cursor:grab;user-select:none;overflow:hidden;";

    // Ruler ticks
    for (let x = 0; x <= 700; x += 100) {
      const tick = document.createElement("div");
      tick.style.cssText = `position:absolute;top:0;bottom:0;left:${x}px;width:1px;background:rgba(255,255,255,0.06);pointer-events:none;`;
      track.appendChild(tick);
      if (x > 0) {
        const label = document.createElement("span");
        label.textContent = String(x);
        label.style.cssText = `position:absolute;top:4px;left:${x + 4}px;font-size:10px;color:rgba(255,255,255,0.2);font-family:monospace;pointer-events:none;`;
        track.appendChild(label);
      }
    }

    const block = document.createElement("div");
    block.style.cssText =
      "position:absolute;top:50%;width:50px;height:50px;border-radius:8px;background:linear-gradient(135deg,#c678dd,#a855f7);pointer-events:none;cursor:grab;";
    block.style.transform = "translateY(-50%)";
    track.appendChild(block);
    container.appendChild(track);

    const velocityDisplay = document.createElement("div");
    velocityDisplay.style.cssText =
      "display:flex;align-items:center;gap:12px;width:700px;font-size:13px;color:#888;font-family:monospace;";
    const vl = document.createElement("span");
    vl.textContent = "velocity";
    vl.style.cssText = "min-width:60px;color:#666;";
    const vv = document.createElement("span");
    vv.textContent = "0.00";
    vv.style.cssText = "min-width:60px;text-align:right;color:#c678dd;";
    velocityDisplay.appendChild(vl);
    velocityDisplay.appendChild(vv);
    container.appendChild(velocityDisplay);

    let currentDecel = decelerationMs;

    const inertia = createInertia({
      decelerationMs: () => currentDecel,
      precision: 0.5,
      onUpdate: (value, velocity) => {
        block.style.left = `${value}px`;
        vv.textContent = velocity.toFixed(2);
      },
    });

    // Start at position 30
    inertia.setValue(30);

    const handlePointerDown = (e: PointerEvent) => {
      track.setPointerCapture(e.pointerId);
      inertia.track(e.clientX - track.getBoundingClientRect().left - 25);
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons === 0) return;
      inertia.track(e.clientX - track.getBoundingClientRect().left - 25);
    };
    const handlePointerUp = () => {
      inertia.release();
    };
    track.addEventListener("pointerdown", handlePointerDown);
    track.addEventListener("pointermove", handlePointerMove);
    track.addEventListener("pointerup", handlePointerUp);
    track.addEventListener("pointercancel", handlePointerUp);

    // Deceleration slider
    const sliderRow = document.createElement("div");
    sliderRow.style.cssText =
      "display:flex;align-items:center;gap:8px;width:700px;font-size:12px;color:#888;font-family:monospace;";
    const sl = document.createElement("span");
    sl.textContent = "decelerationMs";
    sl.style.cssText = "min-width:110px;";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "50";
    slider.max = "2000";
    slider.step = "50";
    slider.value = String(decelerationMs);
    slider.style.cssText = "accent-color:#c678dd;width:200px;";
    const sv = document.createElement("span");
    sv.textContent = String(decelerationMs);
    sv.style.cssText = "min-width:30px;color:#c678dd;";
    slider.addEventListener("input", () => {
      currentDecel = Number(slider.value);
      sv.textContent = slider.value;
    });
    sliderRow.appendChild(sl);
    sliderRow.appendChild(slider);
    sliderRow.appendChild(sv);
    container.appendChild(sliderRow);

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
