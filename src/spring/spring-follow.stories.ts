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
    description.textContent = "Move your mouse over the track — the block chases it with spring physics";
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
      position: absolute; top: 50%; left: 30px;
      width: 50px; height: 50px; border-radius: 8px;
      background: linear-gradient(135deg, #98c379, #56ab2f);
      transform: translateY(-50%) translateX(0px);
      pointer-events: none;
    `;
    track.appendChild(block);
    container.appendChild(track);

    // Spring trace canvas
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 80;
    canvas.style.cssText = "border-radius:8px;background:#1e1e2e;width:700px;height:80px;";
    const ctx = canvas.getContext("2d")!;
    container.appendChild(canvas);

    // Velocity indicator
    const velocityRow = document.createElement("div");
    velocityRow.style.cssText = "display:flex;align-items:center;gap:12px;width:700px;font-size:13px;color:#888;font-family:monospace;";

    const velocityLabel = document.createElement("span");
    velocityLabel.textContent = "velocity";
    velocityLabel.style.cssText = "min-width:60px;color:#666;";

    const velocityBar = document.createElement("div");
    velocityBar.style.cssText = "flex:1;height:6px;background:#2a2a3d;border-radius:3px;overflow:hidden;position:relative;";
    const velocityFill = document.createElement("div");
    velocityFill.style.cssText = "position:absolute;top:0;left:50%;height:100%;width:0%;background:#98c379;border-radius:3px;";
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

    const makeSlider = (label: string, min: number, max: number, step: number, value: number, color: string) => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display:flex;align-items:center;gap:8px;font-size:12px;color:#888;font-family:monospace;";
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
      slider.addEventListener("input", () => { val.textContent = slider.value; });
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
    let mouseX = 30;
    let targetX = 30;
    const spring = createSpring({
      from: 30,
      to: () => targetX,
      stiffness: 180,
      damping: 12,
      mass: 1,
      precision: 0.01,
      onUpdate: (value, velocity) => {
        block.style.transform = `translateY(-50%) translateX(${value}px)`;

        const absVel = Math.abs(velocity);
        const barPercent = Math.min(absVel * 0.4, 100);
        velocityFill.style.width = `${barPercent}%`;
        velocityFill.style.left = velocity >= 0 ? "50%" : `${50 - barPercent}%`;
        velocityFill.style.background = velocity >= 0 ? "#98c379" : "#e06c75";
        velocityValue.textContent = velocity.toFixed(2);

        drawTrace(value);
      },
    });


    // Update target on mouse move — spring auto-chases
    track.addEventListener("mousemove", (e) => {
      const rect = track.getBoundingClientRect();
      targetX = e.clientX - rect.left - 25;
      targetX = Math.max(0, Math.min(650, targetX));
      mouseX = targetX;
      mouseLine.style.display = "block";
      targetDot.style.display = "block";
      mouseLine.style.left = `${targetX + 25}px`;
      targetDot.style.left = `${targetX + 25}px`;
    });

    track.addEventListener("mouseleave", () => {
      mouseLine.style.display = "none";
      targetDot.style.display = "none";
    });

    // Trace drawing
    const tracePoints: { x: number; v: number }[] = [];

    const drawTrace = (x: number) => {
      tracePoints.push({ x, v: spring.velocity });
      if (tracePoints.length > 200) tracePoints.shift();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the trace line
      ctx.strokeStyle = "#98c379";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const startX = canvas.width - tracePoints.length;
      tracePoints.forEach((pt, i) => {
        const px = startX + i;
        const py = canvas.height / 2 - (pt.x - mouseX) * 0.3;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Center reference line
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.fillText("position", 4, 12);
      ctx.fillText("target", canvas.width - 40, canvas.height / 2 - 4);
    };

    // Update spring params in real time
    const updateSpring = () => {
      if (spring) {
        spring.stiffness = Number(stiffnessCtrl.slider.value);
        spring.damping = Number(dampingCtrl.slider.value);
        spring.mass = Number(massCtrl.slider.value);
      }
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
