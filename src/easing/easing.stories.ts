import type { Meta, StoryObj } from "@storybook/html-vite";

import { createAnimation } from "../animation/create-animation";
import type { Animation } from "../animation/create-animation";
import type { EaseName } from "../shared/types";
import { getTicker } from "../ticker/get-ticker";
import { easingFunctions, EASE_NAMES } from "./easing";

// Start the ticker for Storybook demos
getTicker().start();

const meta = {
  title: "Easing Functions",
  argTypes: {
    ease: {
      control: "select",
      options: EASE_NAMES,
    },
    durationMs: {
      control: { type: "range", min: 200, max: 5000, step: 100 },
    },
  },
  args: {
    ease: "outElastic" as EaseName,
    durationMs: 2000,
  },
  render: ({ ease, durationMs }) => {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      gap: 24px; padding: 40px; font-family: sans-serif;
    `;

    // Title
    const title = document.createElement("h2");
    title.textContent = `Easing: ${ease}`;
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    // Track — uses flexbox + padding for the left margin, no layout properties animated
    const track = document.createElement("div");
    track.style.cssText = `
      display: flex; align-items: center; padding-left: 100px;
      width: 900px; height: 100px;
      background: #2a2a3d; border-radius: 8px;
    `;

    // Block — only transform properties change per frame (GPU composited)
    const block = document.createElement("div");
    block.style.cssText = `
      width: 60px; height: 60px; border-radius: 8px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      transform: translateX(0px);
    `;
    track.appendChild(block);
    container.appendChild(track);

    // Easing curve preview
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 200;
    canvas.style.cssText = "border-radius:8px;background:#1e1e2e;width:900px;height:200px;";
    const ctx = canvas.getContext("2d")!;

    const drawCurve = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const easeFn = easingFunctions[ease];

      // Sample points to find min/max y (for overshoot scaling)
      const samples: number[] = [];
      for (let x = 0; x < canvas.width; x++) {
        samples.push(easeFn(x / canvas.width));
      }
      let yMin = Math.min(...samples);
      let yMax = Math.max(...samples);
      // Ensure at least [0, 1] range
      if (yMin > 0) yMin = 0;
      if (yMax < 1) yMax = 1;
      const yRange = yMax - yMin || 1;

      const topPadding = 24;
      const bottomPadding = 20;
      const plotHeight = canvas.height - topPadding - bottomPadding;

      // Reference lines at 0 and 1
      const y0 = canvas.height - bottomPadding - ((0 - yMin) / yRange) * plotHeight;
      const y1 = canvas.height - bottomPadding - ((1 - yMin) / yRange) * plotHeight;

      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(canvas.width, y0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y1);
      ctx.lineTo(canvas.width, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw the curve
      ctx.strokeStyle = "#667eea";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const t = x / canvas.width;
        const y = easeFn(t);
        const px = x;
        const py = canvas.height - bottomPadding - ((y - yMin) / yRange) * plotHeight;
        if (x === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Labels
      ctx.fillStyle = "#666";
      ctx.font = "11px monospace";
      ctx.fillText("0", 4, y0 - 4);
      ctx.fillText("1", 4, y1 - 4);
      ctx.fillText("time →", canvas.width / 2 - 20, canvas.height - 4);
    };
    drawCurve();

    container.appendChild(canvas);

    // Progress bar
    const progressBar = document.createElement("div");
    progressBar.style.cssText = `
      width: 900px; height: 4px; background: #2a2a3d; border-radius: 2px; overflow: hidden;
    `;
    const progressFill = document.createElement("div");
    progressFill.style.cssText = `
      width: 0%; height: 100%; background: #667eea; border-radius: 2px; transition: none;
    `;
    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);

    // Velocity indicator
    const velocityRow = document.createElement("div");
    velocityRow.style.cssText = `
      display: flex; align-items: center; gap: 12px;
      width: 900px; font-size: 13px; color: #888; font-family: monospace;
    `;

    const velocityLabel = document.createElement("span");
    velocityLabel.textContent = "velocity";
    velocityLabel.style.cssText = "min-width: 60px; color: #666;";

    const velocityBarTrack = document.createElement("div");
    velocityBarTrack.style.cssText = `
      flex: 1; height: 6px; background: #2a2a3d; border-radius: 3px; overflow: hidden;
      position: relative;
    `;

    const velocityBarFill = document.createElement("div");
    velocityBarFill.style.cssText = `
      position: absolute; top: 0; left: 50%; height: 100%;
      background: #a8e063; border-radius: 3px; transition: none;
      width: 0%; transform: translateX(0%);
    `;
    velocityBarTrack.appendChild(velocityBarFill);

    const velocityValue = document.createElement("span");
    velocityValue.textContent = "0.00";
    velocityValue.style.cssText = "min-width: 60px; text-align: right; color: #a8e063;";

    velocityRow.appendChild(velocityLabel);
    velocityRow.appendChild(velocityBarTrack);
    velocityRow.appendChild(velocityValue);
    container.appendChild(velocityRow);

    // Controls row
    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;gap:12px;align-items:center;";

    const playBtn = document.createElement("button");
    playBtn.textContent = "▶ Play";
    playBtn.style.cssText = `
      padding: 8px 24px; border: 1px solid #667eea; border-radius: 6px;
      background: transparent; color: #667eea; cursor: pointer;
      font-size: 14px; min-width: 100px;
    `;

    const returnBtn = document.createElement("button");
    returnBtn.textContent = "↺ Return";
    returnBtn.style.cssText = `
      padding: 8px 16px; border: 1px solid #555; border-radius: 6px;
      background: transparent; color: #888; cursor: pointer;
      font-size: 14px;
    `;

    controls.appendChild(playBtn);
    controls.appendChild(returnBtn);
    container.appendChild(controls);

    // State
    let tween: Animation | undefined = undefined;

    const resetPosition = () => {
      block.style.transform = "translateX(0px)";
      progressFill.style.width = "0%";
      velocityBarFill.style.width = "0%";
      velocityValue.textContent = "0.00";
    };

    const play = () => {
      if (tween) {
        tween.kill();
      }
      resetPosition();

      tween = createAnimation({
        from: 0,
        to: 640,
        durationMs,
        ease,
        onUpdate: (value, velocity) => {
          block.style.transform = `translateX(${value}px)`;
          if (tween) {
            progressFill.style.width = `${tween.progress * 100}%`;
          }

          const absVel = Math.abs(velocity);
          const barPercent = Math.min(absVel * 25, 100);
          velocityBarFill.style.width = `${barPercent}%`;
          velocityBarFill.style.left = velocity >= 0 ? "50%" : `${50 - barPercent}%`;
          velocityBarFill.style.background = velocity >= 0 ? "#a8e063" : "#e06c75";
          velocityValue.textContent = velocity.toFixed(2);
        },
        onEnded: () => {
          tween = undefined;
          playBtn.textContent = "▶ Play";
          progressFill.style.width = "100%";
        },
      });

      void tween.play();
      playBtn.textContent = "⏸ Pause";
    };

    const togglePlay = () => {
      if (!tween || (tween.status !== "playing" && tween.status !== "paused")) {
        play();
        return;
      }
      if (tween.status === "playing") {
        tween.pause();
        playBtn.textContent = "▶ Resume";
      } else {
        tween.resume();
        playBtn.textContent = "⏸ Pause";
      }
    };

    playBtn.addEventListener("click", togglePlay);

    returnBtn.addEventListener("click", () => {
      const startPos = tween ? tween.currentValue : 640;

      if (tween) {
        tween.kill();
      }

      tween = createAnimation({
        from: startPos,
        to: 0,
        durationMs,
        ease,
        onUpdate: (value, velocity) => {
          block.style.transform = `translateX(${value}px)`;
          if (tween) {
            progressFill.style.width = `${tween.progress * 100}%`;
          }
          const absVel = Math.abs(velocity);
          const barPercent = Math.min(absVel * 25, 100);
          velocityBarFill.style.width = `${barPercent}%`;
          velocityBarFill.style.left = velocity >= 0 ? "50%" : `${50 - barPercent}%`;
          velocityBarFill.style.background = velocity >= 0 ? "#a8e063" : "#e06c75";
          velocityValue.textContent = velocity.toFixed(2);
        },
        onEnded: () => {
          tween = undefined;
          playBtn.textContent = "▶ Play";
        },
      });

      void tween.play();
      playBtn.textContent = "⏸ Pause";
    });

    return container;
  },
} satisfies Meta<{ ease: EaseName; durationMs: number }>;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
