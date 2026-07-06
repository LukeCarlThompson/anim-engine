import type { Meta, StoryObj } from "@storybook/html-vite";

import { getTicker } from "../domain";
import { createSmoothClamp } from "../smooth-clamp/smooth-clamp";
import { createAnimation } from "./create-animation";

getTicker().start();

const meta = {
  title: "Keyframes",
  argTypes: {
    durationMs: {
      control: { type: "range", min: 500, max: 5000, step: 100 },
    },
  },
  args: {
    durationMs: 3000,
  },
  render: ({ durationMs }) => {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      gap: 24px; padding: 40px; font-family: sans-serif;
    `;

    const title = document.createElement("h2");
    title.textContent = "Keyframe Animation";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const subtitle = document.createElement("p");
    subtitle.textContent = "A single createAnimation() with multiple keyframes at different times";
    subtitle.style.cssText = "margin:0;color:#666;font-size:13px;";
    container.appendChild(subtitle);

    // Track
    const track = document.createElement("div");
    track.style.cssText = `
      display: flex; align-items: center; padding-left: 30px;
      width: 700px; height: 80px;
      background: #2a2a3d; border-radius: 8px;
    `;

    const block = document.createElement("div");
    block.style.cssText = `
      width: 40px; height: 40px; border-radius: 6px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      transform: translateX(0px);
    `;
    track.appendChild(block);
    container.appendChild(track);

    // Progress bar (scrubbable)
    const progressBar = document.createElement("div");
    progressBar.style.cssText =
      "width:700px;height:8px;background:#2a2a3d;border-radius:4px;cursor:pointer;position:relative;";

    const progressFill = document.createElement("div");
    progressFill.style.cssText =
      "position:absolute;top:0;left:0;height:100%;background:#667eea;border-radius:4px;pointer-events:none;";
    progressFill.style.width = "0%";
    progressBar.appendChild(progressFill);

    const scrubHandle = document.createElement("div");
    scrubHandle.style.cssText = `
      position: absolute; top: 50%; width: 16px; height: 16px;
      border-radius: 50%; background: #fff; border: 2px solid #667eea;
      transform: translate(-50%, -50%); pointer-events: none; z-index: 1;
    `;
    scrubHandle.style.left = "0%";
    progressBar.appendChild(scrubHandle);
    container.appendChild(progressBar);

    // Controls
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

    const smoothClamp = createSmoothClamp(45);

    let playing = false;

    const anim = createAnimation({
      keyframes: [
        { value: 0 },
        { value: 200, gap: 0.2 * durationMs, ease: "outQuart" },
        { value: 450, gap: 0.3 * durationMs, ease: "outCubic" },
        { value: 350, gap: 0.25 * durationMs, ease: "outQuart" },
        { value: 630, gap: 0.25 * durationMs, ease: "outElastic" },
      ],
      onUpdate: (value, velocity) => {
        const rotation = smoothClamp(velocity * 0.05);
        block.style.transform = `translateX(${value}px) rotate(${rotation}deg)`;
      },
      onProgress: (p) => {
        const pct = `${p * 100}%`;
        progressFill.style.width = pct;
        scrubHandle.style.left = pct;
      },
      onEnded: () => {
        playing = false;
        playBtn.textContent = "▶ Play";
      },
    });

    const reset = () => {
      block.style.transform = "translateX(0px) rotate(0deg)";
      progressFill.style.width = "0%";
      scrubHandle.style.left = "0%";
    };

    let scrubbing = false;

    const scrubTo = (e: MouseEvent) => {
      const rect = progressBar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const pct = `${ratio * 100}%`;
      progressFill.style.width = pct;
      scrubHandle.style.left = pct;
      anim.setProgress(ratio);
      if (playing) {
        playing = false;
        playBtn.textContent = "▶ Play";
      }
    };

    progressBar.addEventListener("mousedown", (e) => {
      scrubbing = true;
      scrubTo(e);
    });
    window.addEventListener("mousemove", (e) => {
      if (scrubbing) scrubTo(e);
    });
    window.addEventListener("mouseup", () => {
      scrubbing = false;
    });

    const play = () => {
      reset();
      void anim.play();
      playing = true;
      playBtn.textContent = "⏸ Pause";
    };

    const togglePlay = () => {
      if (anim.status === "stopped" || anim.status === "dead") {
        play();
        return;
      }
      if (anim.status === "playing") {
        anim.pause();
        playing = false;
        playBtn.textContent = "▶ Resume";
      } else {
        anim.resume();
        playing = true;
        playBtn.textContent = "⏸ Pause";
      }
    };

    playBtn.addEventListener("click", togglePlay);
    resetBtn.addEventListener("click", () => {
      playing = false;
      anim.stop();
      reset();
      playBtn.textContent = "▶ Play";
    });

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
