import type { Meta, StoryObj } from "@storybook/html";
import { createAnimation } from "./create-animation";
import { getTicker } from "../ticker/get-ticker";
import { createSmoothClamp } from "../smooth-clamp/smooth-clamp";

getTicker().start();

const meta = {
  title: "Keyframes",
  tags: ["autodocs"],
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

    // Progress bar
    const progressBar = document.createElement("div");
    progressBar.style.cssText =
      "width:700px;height:4px;background:#2a2a3d;border-radius:2px;overflow:hidden;";
    const progressFill = document.createElement("div");
    progressFill.style.cssText = "width:0%;height:100%;background:#667eea;border-radius:2px;";
    progressBar.appendChild(progressFill);
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

    const anim = createAnimation({
      keyframes: [
        { at: 0, value: 0 },
        { at: 0.2 * durationMs, value: 200, ease: "outQuart" },
        { at: 0.5 * durationMs, value: 450, ease: "outCubic" },
        { at: 0.75 * durationMs, value: 350, ease: "outQuart" },
        { at: 1 * durationMs, value: 630, ease: "outElastic" },
      ],
      onUpdate: (value, velocity) => {
        const rotation = smoothClamp(velocity * 0.05);
        block.style.transform = `translateX(${value}px) rotate(${rotation}deg)`;
      },
      onProgress: (p) => {
        progressFill.style.width = `${Math.round(p * 100)}%`;
      },
      onEnded: () => {
        playBtn.textContent = "▶ Play";
        progressFill.style.width = "100%";
      },
    });

    const reset = () => {
      block.style.transform = "translateX(0px) rotate(0deg)";
      progressFill.style.width = "0%";
    };

    const play = () => {
      reset();
      anim.setCurrent(0);
      const p = anim.play();
      void p.then(() => {
        playBtn.textContent = "▶ Play";
      });
      playBtn.textContent = "⏸ Pause";
    };

    const togglePlay = () => {
      if (anim.status === "stopped" || anim.status === "dead") {
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
