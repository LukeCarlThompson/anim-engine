import type { Meta, StoryObj } from "@storybook/html";
import { createSpring } from "./create-spring";
import { getTicker } from "../ticker/get-ticker";

getTicker().start();

const meta = {
  title: "Spring/Spring Follow",
  tags: ["autodocs"],
  render: () => {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      gap: 24px; padding: 40px; font-family: sans-serif;
    `;

    const title = document.createElement("h2");
    title.textContent = "Spring — Mouse Follow";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const description = document.createElement("p");
    description.textContent =
      "Move your mouse over the track — the block chases it with spring physics";
    description.style.cssText = "margin:0;color:#666;font-size:13px;";
    container.appendChild(description);

    // Track
    const track = document.createElement("div");
    track.style.cssText = `
      position: relative; width: 700px; height: 150px;
      background: #2a2a3d; border-radius: 8px; cursor: pointer;
      overflow: hidden; user-select: none;
    `;

    // Mouse position indicator (vertical line)
    const mouseLine = document.createElement("div");
    mouseLine.style.cssText = `
      position: absolute; top: 0; bottom: 0; width: 2px;
      background: rgba(255,255,255,0.1); pointer-events: none;
      display: none;
    `;
    track.appendChild(mouseLine);

    // Target dot (where the mouse is)
    const targetDot = document.createElement("div");
    targetDot.style.cssText = `
      position: absolute; top: 50%; width: 10px; height: 10px;
      border-radius: 50%; background: rgba(255,255,255,0.2);
      transform: translate(-50%, -50%); pointer-events: none;
      display: none;
    `;
    track.appendChild(targetDot);

    // Spring block
    const block = document.createElement("div");
    block.style.cssText = `
      position: absolute; top: 50%;
      width: 50px; height: 50px; border-radius: 8px;
      background: linear-gradient(135deg, #98c379, #56ab2f);
      pointer-events: none;
    `;
    track.appendChild(block);
    container.appendChild(track);

    // Velocity indicator
    const velocityRow = document.createElement("div");
    velocityRow.style.cssText =
      "display:flex;align-items:center;gap:12px;width:700px;font-size:13px;color:#888;font-family:monospace;";

    const velocityLabel = document.createElement("span");
    velocityLabel.textContent = "velocity";
    velocityLabel.style.cssText = "min-width:60px;color:#666;";

    const velocityBar = document.createElement("div");
    velocityBar.style.cssText =
      "flex:1;height:6px;background:#2a2a3d;border-radius:3px;overflow:hidden;position:relative;";
    const velocityFill = document.createElement("div");
    velocityFill.style.cssText =
      "position:absolute;top:0;left:50%;height:100%;width:0%;background:#98c379;border-radius:3px;";
    velocityBar.appendChild(velocityFill);

    const velocityValue = document.createElement("span");
    velocityValue.textContent = "0.00";
    velocityValue.style.cssText = "min-width:60px;text-align:right;color:#98c379;";

    velocityRow.appendChild(velocityLabel);
    velocityRow.appendChild(velocityBar);
    velocityRow.appendChild(velocityValue);
    container.appendChild(velocityRow);

    // Controls
    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;gap:16px;align-items:center;flex-wrap:wrap;";

    const makeSlider = (
      label: string,
      min: number,
      max: number,
      step: number,
      value: number,
      color: string,
    ) => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText =
        "display:flex;align-items:center;gap:8px;font-size:12px;color:#888;font-family:monospace;";
      const lbl = document.createElement("span");
      lbl.textContent = label;
      lbl.style.cssText = "min-width:60px;";
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = String(min);
      slider.max = String(max);
      slider.step = String(step);
      slider.value = String(value);
      slider.style.cssText = "accent-color:" + color + ";width:100px;";
      const val = document.createElement("span");
      val.textContent = String(value);
      val.style.cssText = "min-width:30px;color:" + color + ";";
      slider.addEventListener("input", () => {
        val.textContent = slider.value;
      });
      wrapper.appendChild(lbl);
      wrapper.appendChild(slider);
      wrapper.appendChild(val);
      return { wrapper, slider, val };
    };

    const stiffnessCtrl = makeSlider("stiffness", 10, 500, 10, 180, "#98c379");
    const dampingCtrl = makeSlider("damping", 1, 50, 1, 12, "#e06c75");
    const massCtrl = makeSlider("mass", 0.1, 10, 0.1, 1, "#61afef");

    controls.appendChild(stiffnessCtrl.wrapper);
    controls.appendChild(dampingCtrl.wrapper);
    controls.appendChild(massCtrl.wrapper);
    container.appendChild(controls);

    // Spring state
    let targetX = 30;
    let currentStiffness = 180;
    let currentDamping = 12;
    let currentMass = 1;

    createSpring({
      from: 30,
      to: () => targetX,
      stiffness: () => currentStiffness,
      damping: () => currentDamping,
      mass: () => currentMass,
      precision: 0.01,
      onUpdate: (value, velocity) => {
        block.style.transform = `translateY(-50%) translateX(${value}px)`;

        const absVel = Math.abs(velocity);
        const barPercent = Math.min(absVel * 0.01, 100);
        velocityFill.style.width = `${barPercent}%`;
        velocityFill.style.left = velocity >= 0 ? "50%" : `${50 - barPercent}%`;
        velocityFill.style.background = velocity >= 0 ? "#98c379" : "#e06c75";
        velocityValue.textContent = velocity.toFixed(2);
      },
    });

    // Update target on mouse move — spring auto-chases
    track.addEventListener("mousemove", (e) => {
      const rect = track.getBoundingClientRect();
      targetX = e.clientX - rect.left - 25;
      targetX = Math.max(0, Math.min(650, targetX));
      mouseLine.style.display = "block";
      targetDot.style.display = "block";
      mouseLine.style.left = `${targetX + 25}px`;
      targetDot.style.left = `${targetX + 25}px`;
    });

    track.addEventListener("mouseleave", () => {
      mouseLine.style.display = "none";
      targetDot.style.display = "none";
    });

    const updateSpring = () => {
      currentStiffness = Number(stiffnessCtrl.slider.value);
      currentDamping = Number(dampingCtrl.slider.value);
      currentMass = Number(massCtrl.slider.value);
    };

    stiffnessCtrl.slider.addEventListener("input", updateSpring);
    dampingCtrl.slider.addEventListener("input", updateSpring);
    massCtrl.slider.addEventListener("input", updateSpring);

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
