import type { Meta, StoryObj } from "@storybook/html";
import { animate } from "../tween/create-tween";
import { createTimeline } from "./create-timeline";
import { getTicker } from "../ticker/get-ticker";

getTicker().start();

const meta = {
  title: "Timeline",
  tags: ["autodocs"],
  render: () => {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      gap: 16px; padding: 40px; font-family: sans-serif;
    `;

    const title = document.createElement("h2");
    title.textContent = "Timeline Demo";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const trackContainer = document.createElement("div");
    trackContainer.style.cssText = "display:flex;flex-direction:column;gap:12px;width:700px;";

    const colors = ["#667eea", "#a8e063", "#e06c75", "#e5c07b"];
    const labels = ["Red", "Green", "Blue", "Gold"];

    const blocks: HTMLDivElement[] = [];

    colors.forEach((color, i) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:12px;";

      const label = document.createElement("span");
      label.textContent = labels[i];
      label.style.cssText = "min-width:50px;color:#888;font-size:13px;font-family:monospace;";
      row.appendChild(label);

      const track = document.createElement("div");
      track.style.cssText = `
        flex:1;height:40px;background:#2a2a3d;border-radius:6px;
        display:flex;align-items:center;padding-left:10px;
      `;

      const block = document.createElement("div");
      block.style.cssText = `
        width:30px;height:30px;border-radius:4px;
        background:${color};transform:translateX(0px);
      `;
      blocks.push(block);
      track.appendChild(block);
      row.appendChild(track);
      trackContainer.appendChild(row);
    });

    const progressBar = document.createElement("div");
    progressBar.style.cssText = "width:700px;height:4px;background:#2a2a3d;border-radius:2px;overflow:hidden;";
    const progressFill = document.createElement("div");
    progressFill.style.cssText = "width:0%;height:100%;background:#667eea;border-radius:2px;";
    progressBar.appendChild(progressFill);
    trackContainer.appendChild(progressBar);

    container.appendChild(trackContainer);

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

    // Build animations
    const resetBlocks = () => {
      blocks.forEach((b) => { b.style.transform = "translateX(0px)"; });
      progressFill.style.width = "0%";
    };

    const red = animate({
      from: 0, to: 620, durationMs: 800, ease: "outQuart",
      onUpdate: (v) => { blocks[0].style.transform = `translateX(${v}px)`; },
    });

    const green = animate({
      from: 0, to: 620, durationMs: 600, ease: "outElastic",
      onUpdate: (v) => { blocks[1].style.transform = `translateX(${v}px)`; },
    });

    const blue = animate({
      from: 0, to: 620, durationMs: 400, ease: "inOutBack",
      onUpdate: (v) => { blocks[2].style.transform = `translateX(${v}px)`; },
    });

    const gold = animate({
      from: 0, to: 620, durationMs: 700, ease: "outBounce",
      onUpdate: (v) => { blocks[3].style.transform = `translateX(${v}px)`; },
    });

    let timeline: ReturnType<typeof createTimeline> | null = null;

    const play = () => {
      if (timeline) { timeline.kill(); }
      resetBlocks();

      timeline = createTimeline({
        keyframes: [
          { at: 0, animations: [red, gold] },
          { gap: 200, animations: [green] },
          { gap: -300, animations: [blue] },
        ],
        onEnded: () => {
          timeline = null;
          playBtn.textContent = "▶ Play";
          progressFill.style.width = "100%";
        },
      });

      const p = timeline.play();
      const interval = setInterval(() => {
        if (timeline) {
          progressFill.style.width = `${Math.round(timeline.progress * 100)}%`;
        } else {
          clearInterval(interval);
        }
      }, 50);

      void p.then(() => clearInterval(interval));
      playBtn.textContent = "⏸ Pause";
    };

    const togglePlay = () => {
      if (!timeline || (timeline.status !== "playing" && timeline.status !== "paused")) {
        play();
        return;
      }
      if (timeline.status === "playing") {
        timeline.pause();
        playBtn.textContent = "▶ Resume";
      } else {
        timeline.resume();
        playBtn.textContent = "⏸ Pause";
      }
    };

    playBtn.addEventListener("click", togglePlay);

    resetBtn.addEventListener("click", () => {
      if (timeline) { timeline.kill(); timeline = null; }
      resetBlocks();
      playBtn.textContent = "▶ Play";
    });

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
