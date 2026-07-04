import type { Meta, StoryObj } from "@storybook/html-vite";

import { createAnimation } from "../animation/create-animation";
import { getTicker } from "../ticker/get-ticker";
import { createTimeline } from "./create-timeline";

getTicker().start();

const meta = {
  title: "Timeline",
  render: () => {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      gap: 16px; padding: 40px; font-family: sans-serif;
    `;

    const title = document.createElement("h2");
    title.textContent = "Timeline — Multi-Scene Orchestration";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const info = document.createElement("p");
    info.textContent = "Multiple tweens, timed with at and gap — drag the progress bar to scrub";
    info.style.cssText = "margin:0;color:#666;font-size:13px;";
    container.appendChild(info);

    const scene = document.createElement("div");
    scene.style.cssText = `
      position: relative; width: 700px; height: 180px;
      background: #1e1e2e; border-radius: 12px; overflow: hidden;
    `;

    const floor = document.createElement("div");
    floor.style.cssText =
      "position:absolute;bottom:30px;left:0;right:0;height:2px;background:#333;";
    scene.appendChild(floor);

    const colors = ["#e06c75", "#e5c07b", "#98c379", "#61afef"];
    const labels = ["A", "B", "C", "D"];
    const bgs = ["60", "110", "60", "110"];

    const els = labels.map((label, i) => {
      const el = document.createElement("div");
      el.style.cssText = `
        position:absolute;bottom:${bgs[i]}px;left:20px;
        width:36px;height:36px;border-radius:6px;
        background:${colors[i]};display:flex;align-items:center;
        justify-content:center;color:#fff;font-size:10px;
        font-family:monospace;transform:translateX(0px);
      `;
      el.textContent = label;
      scene.appendChild(el);
      return el;
    });

    container.appendChild(scene);

    // Legend
    const legend = document.createElement("div");
    legend.style.cssText =
      "display:flex;gap:16px;font-size:11px;color:#888;font-family:monospace;flex-wrap:wrap;";
    const timingLabels = [
      "A: at 0, outQuart",
      "B: at 0, outBounce",
      "C: gap 200ms, outElastic",
      "D: gap 200ms, inOutBack",
    ];
    colors.forEach((c, i) => {
      const item = document.createElement("div");
      item.style.cssText = "display:flex;align-items:center;gap:4px;";
      const dot = document.createElement("span");
      dot.style.cssText = `width:8px;height:8px;border-radius:2px;background:${c};display:inline-block;`;
      item.appendChild(dot);
      item.appendChild(document.createTextNode(timingLabels[i]));
      legend.appendChild(item);
    });
    container.appendChild(legend);

    // Timeline bar (scrubbable)
    const timeBar = document.createElement("div");
    timeBar.style.cssText =
      "width:700px;height:8px;background:#2a2a3d;border-radius:4px;cursor:pointer;position:relative;";

    const timeFill = document.createElement("div");
    timeFill.style.cssText =
      "position:absolute;top:0;left:0;height:100%;background:#667eea;border-radius:4px;pointer-events:none;";
    timeFill.style.width = "0%";
    timeBar.appendChild(timeFill);

    const scrubHandle = document.createElement("div");
    scrubHandle.style.cssText = `
      position: absolute; top: 50%; width: 16px; height: 16px;
      border-radius: 50%; background: #fff; border: 2px solid #667eea;
      transform: translate(-50%, -50%); pointer-events: none; z-index: 1;
    `;
    scrubHandle.style.left = "0%";
    timeBar.appendChild(scrubHandle);
    container.appendChild(timeBar);

    // Controls
    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;gap:12px;";

    const playBtn = document.createElement("button");
    playBtn.textContent = "▶ Play";
    playBtn.style.cssText = `
      padding:8px 24px;border:1px solid #667eea;border-radius:6px;
      background:transparent;color:#667eea;cursor:pointer;font-size:14px;min-width:100px;
    `;

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "↺ Reset";
    resetBtn.style.cssText =
      "padding:8px 16px;border:1px solid #555;border-radius:6px;background:transparent;color:#888;cursor:pointer;font-size:14px;";

    controls.appendChild(playBtn);
    controls.appendChild(resetBtn);
    container.appendChild(controls);

    // Build animations
    const moveA = createAnimation({
      from: 0, to: 640, durationMs: 800, ease: "outQuart",
      onUpdate: (v) => { els[0].style.transform = `translateX(${v}px)`; },
    });
    const moveB = createAnimation({
      from: 0, to: 640, durationMs: 700, ease: "outBounce",
      onUpdate: (v) => { els[1].style.transform = `translateX(${v}px)`; },
    });
    const moveC = createAnimation({
      from: 0, to: 640, durationMs: 1000, ease: "outElastic",
      onUpdate: (v) => { els[2].style.transform = `translateX(${v}px)`; },
    });
    const moveD = createAnimation({
      from: 0, to: 640, durationMs: 600, ease: "inOutBack",
      onUpdate: (v) => { els[3].style.transform = `translateX(${v}px)`; },
    });

    const resetAll = () =>
      els.forEach((el) => {
        el.style.transform = "translateX(0px)";
      });

    const timeline = createTimeline(
      [
        { at: 0, animation: [moveA, moveB] },
        { gap: 200, animation: [moveC] },
        { gap: 200, animation: [moveD] },
      ],
      {
        onProgress: (progress) => {
          const pct = `${Math.round(progress * 100)}%`;
          timeFill.style.width = pct;
          scrubHandle.style.left = pct;
        },
        onEnded: () => {
          playBtn.textContent = "▶ Play";
        },
      },
    );

    let scrubbing = false;
    let playing = false;

    const scrubTo = (e: MouseEvent) => {
      const rect = timeBar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const pct = `${Math.round(ratio * 100)}%`;
      timeFill.style.width = pct;
      scrubHandle.style.left = pct;
      timeline.setProgress(ratio);
      if (playing) {
        playing = false;
        playBtn.textContent = "▶ Play";
      }
    };

    timeBar.addEventListener("mousedown", (e) => {
      scrubbing = true;
      scrubTo(e);
    });
    window.addEventListener("mousemove", (e) => {
      if (scrubbing) scrubTo(e);
    });
    window.addEventListener("mouseup", () => {
      scrubbing = false;
    });

    const togglePlay = () => {
      if (playing) {
        timeline.pause();
        playBtn.textContent = "▶ Play";
      } else {
        if (timeline.status === "stopped") {
          resetAll();
          timeline.play();
        } else {
          timeline.resume();
        }
        playBtn.textContent = "⏸ Pause";
      }
      playing = !playing;
    };

    playBtn.addEventListener("click", togglePlay);
    resetBtn.addEventListener("click", () => {
      playing = false;
      resetAll();
      timeline.stop();
      timeline.setProgress(0);
      timeFill.style.width = "0%";
      scrubHandle.style.left = "0%";
      playBtn.textContent = "▶ Play";
    });

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
