import type { Meta, StoryObj } from "@storybook/html";
import { animate } from "../tween/create-tween";
import { getTicker } from "../ticker/get-ticker";

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
    subtitle.textContent = "A single animate() with multiple keyframes at different times";
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

    // Keyframe markers
    const markers = document.createElement("div");
    markers.style.cssText = `
      display: flex; align-items: center; padding-left: 30px;
      width: 700px; height: 20px; position: relative;
    `;

    const times = [0, 0.2, 0.5, 0.75, 1].map((f) => f * durationMs);
    const colors = ["#e06c75", "#e5c07b", "#98c379", "#61afef", "#c678dd"];
    const labels = [`0ms`, `${Math.round(times[1])}ms`, `${Math.round(times[2])}ms`, `${Math.round(times[3])}ms`, `${Math.round(times[4])}ms`];

    times.forEach((t, i) => {
      const pct = (t / durationMs) * 100;
      const m = document.createElement("div");
      m.style.cssText = `
        position: absolute; left: ${pct}%; top: 0;
        transform: translateX(-50%); font-size: 10px;
        color: ${colors[i]}; font-family: monospace;
      `;
      m.textContent = `▼ ${labels[i]}`;
      markers.appendChild(m);
    });
    container.appendChild(markers);

    // Progress bar
    const progressBar = document.createElement("div");
    progressBar.style.cssText = "width:700px;height:4px;background:#2a2a3d;border-radius:2px;overflow:hidden;";
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

    let currentAnim: ReturnType<typeof animate> | null = null;

    const createKeyframes = () => animate({
      keyframes: [
        { at: times[0], value: 0 },
        { at: times[1], value: 200, ease: "outQuart" },
        { at: times[2], value: 450, ease: "outCubic" },
        { at: times[3], value: 350, ease: "outQuart" },
        { at: times[4], value: 630, ease: "outElastic" },
      ],
      onUpdate: (v) => { block.style.transform = `translateX(${v}px)`; },
      onEnded: () => {
        playBtn.textContent = "▶ Play";
        progressFill.style.width = "100%";
      },
    });

    const reset = () => {
      block.style.transform = "translateX(0px)";
      progressFill.style.width = "0%";
    };

    const play = () => {
      if (currentAnim) { currentAnim.kill(); }
      reset();
      currentAnim = createKeyframes();
      const p = currentAnim.play();
      const interval = setInterval(() => {
        if (currentAnim && (currentAnim.status === "playing" || currentAnim.status === "paused")) {
          progressFill.style.width = `${Math.round(currentAnim.progress * 100)}%`;
        } else {
          clearInterval(interval);
        }
      }, 50);
      void p.then(() => { currentAnim = null; clearInterval(interval); });
      playBtn.textContent = "⏸ Pause";
    };

    const togglePlay = () => {
      if (!currentAnim || (currentAnim.status !== "playing" && currentAnim.status !== "paused")) {
        play();
        return;
      }
      if (currentAnim.status === "playing") {
        currentAnim.pause();
        playBtn.textContent = "▶ Resume";
      } else {
        currentAnim.resume();
        playBtn.textContent = "⏸ Pause";
      }
    };

    playBtn.addEventListener("click", togglePlay);
    resetBtn.addEventListener("click", () => {
      if (currentAnim) { currentAnim.kill(); currentAnim = null; }
      reset();
      playBtn.textContent = "▶ Play";
    });

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
