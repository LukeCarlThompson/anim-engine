import type { Meta, StoryObj } from "@storybook/html-vite";

import { getTicker } from "../ticker/get-ticker";
import { createLerp } from "./create-lerp";

getTicker().start();

const meta = {
  title: "Lerp",
  argTypes: {
    rate: { control: { type: "range", min: 0, max: 10, step: 0.5 } },
  },
  args: { rate: 2 },
  render: ({ rate }) => {
    const container = document.createElement("div");
    container.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px;font-family:sans-serif;";

    const title = document.createElement("h2");
    title.textContent = "Lerp (Exponential Approach)";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const params = document.createElement("div");
    params.style.cssText = "color:#666;font-size:13px;font-family:monospace;";
    params.textContent = `rate: ${rate}/s`;
    container.appendChild(params);

    const track = document.createElement("div");
    track.style.cssText =
      "display:flex;align-items:center;padding-left:30px;width:700px;height:100px;background:#2a2a3d;border-radius:8px;";

    const block = document.createElement("div");
    block.style.cssText =
      "width:50px;height:50px;border-radius:8px;background:linear-gradient(135deg,#e5c07b,#d19a66);transform:translateX(0px);";
    track.appendChild(block);
    container.appendChild(track);

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;gap:12px;";
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "↺ Toggle Target";
    resetBtn.style.cssText =
      "padding:8px 16px;border:1px solid #e5c07b;border-radius:6px;background:transparent;color:#e5c07b;cursor:pointer;font-size:14px;";
    controls.appendChild(resetBtn);
    container.appendChild(controls);

    let targetValue = 620;
    createLerp({
      from: () => 0,
      to: () => targetValue,
      rate,
      onUpdate: (value) => {
        block.style.transform = `translateX(${value}px)`;
      },
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
