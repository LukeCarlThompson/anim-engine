import type { Meta, StoryObj } from "@storybook/html-vite";

import { getTicker } from "../ticker/get-ticker";
import { createSmoothDamp } from "./create-smooth-damp";

getTicker().start();

const meta = {
  title: "Smooth Damp",
  argTypes: {
    smoothTime: { control: { type: "range", min: 0.1, max: 2, step: 0.1 } },
    maxSpeed: { control: { type: "range", min: 10, max: 500, step: 10 } },
  },
  args: { smoothTime: 0.4, maxSpeed: 200 },
  render: ({ smoothTime, maxSpeed }) => {
    const container = document.createElement("div");
    container.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px;font-family:sans-serif;";

    const title = document.createElement("h2");
    title.textContent = "Smooth Damp";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const params = document.createElement("div");
    params.style.cssText = "color:#666;font-size:13px;font-family:monospace;";
    params.textContent = `smoothTime: ${smoothTime}s  maxSpeed: ${maxSpeed}`;
    container.appendChild(params);

    const track = document.createElement("div");
    track.style.cssText =
      "display:flex;align-items:center;padding-left:30px;width:700px;height:100px;background:#2a2a3d;border-radius:8px;";

    const block = document.createElement("div");
    block.style.cssText =
      "width:50px;height:50px;border-radius:8px;background:linear-gradient(135deg,#61afef,#528bff);transform:translateX(0px);";
    track.appendChild(block);
    container.appendChild(track);

    const velRow = document.createElement("div");
    velRow.style.cssText =
      "display:flex;align-items:center;gap:12px;width:700px;font-size:13px;color:#888;font-family:monospace;";
    const velLabel = document.createElement("span");
    velLabel.textContent = "velocity";
    velLabel.style.cssText = "min-width:60px;color:#666;";
    const velTrack = document.createElement("div");
    velTrack.style.cssText =
      "flex:1;height:6px;background:#2a2a3d;border-radius:3px;overflow:hidden;position:relative;";
    const velFill = document.createElement("div");
    velFill.style.cssText =
      "position:absolute;top:0;left:50%;height:100%;width:0%;border-radius:3px;";
    velTrack.appendChild(velFill);
    const velValue = document.createElement("span");
    velValue.textContent = "0.00";
    velValue.style.cssText = "min-width:60px;text-align:right;color:#61afef;";
    velRow.appendChild(velLabel);
    velRow.appendChild(velTrack);
    velRow.appendChild(velValue);
    container.appendChild(velRow);

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;gap:12px;";
    const playBtn = document.createElement("button");
    playBtn.textContent = "⏸ Pause";
    playBtn.style.cssText =
      "padding:8px 24px;border:1px solid #61afef;border-radius:6px;background:transparent;color:#61afef;cursor:pointer;font-size:14px;min-width:100px;";
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "↺ Reset";
    resetBtn.style.cssText =
      "padding:8px 16px;border:1px solid #555;border-radius:6px;background:transparent;color:#888;cursor:pointer;font-size:14px;";
    controls.appendChild(playBtn);
    controls.appendChild(resetBtn);
    container.appendChild(controls);

    let targetValue = 620;
    createSmoothDamp({
      from: () => 0,
      to: () => targetValue,
      smoothTime,
      maxSpeed,
      onUpdate: (value, velocity) => {
        block.style.transform = `translateX(${value}px)`;
        const absoluteVelocity = Math.abs(velocity);
        const barPercent = Math.min(absoluteVelocity * 2, 100);
        velFill.style.width = `${barPercent}%`;
        velFill.style.left = velocity >= 0 ? "50%" : `${50 - barPercent}%`;
        velFill.style.background = velocity >= 0 ? "#61afef" : "#e06c75";
        velValue.textContent = velocity.toFixed(2);
      },
    });

    let paused = false;
    playBtn.addEventListener("click", () => {
      paused = !paused;
      playBtn.textContent = paused ? "▶ Play" : "⏸ Pause";
    });

    resetBtn.addEventListener("click", () => {
      targetValue = targetValue === 620 ? 100 : 620;
    });

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
