import type { Meta, StoryObj } from "@storybook/html";
import { createAnimation } from "../animation/create-animation";
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
    title.textContent = "Timeline — Multi-Scene Orchestration";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const info = document.createElement("p");
    info.textContent = "Multiple tweens, timed with at and gap";
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
      "D: gap -300ms, inOutBack",
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

    // Timeline bar
    const timeBar = document.createElement("div");
    timeBar.style.cssText =
      "width:700px;height:4px;background:#2a2a3d;border-radius:2px;overflow:hidden;";
    const timeFill = document.createElement("div");
    timeFill.style.cssText = "width:0%;height:100%;background:#667eea;border-radius:2px;";
    timeBar.appendChild(timeFill);
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

    // Build tweens
    const moveA = createAnimation({
      from: 0,
      to: 640,
      durationMs: 800,
      ease: "outQuart",
      onUpdate: (v) => {
        els[0].style.transform = `translateX(${v}px)`;
      },
    });
    const moveB = createAnimation({
      from: 0,
      to: 640,
      durationMs: 700,
      ease: "outBounce",
      onUpdate: (v) => {
        els[1].style.transform = `translateX(${v}px)`;
      },
    });
    const moveC = createAnimation({
      from: 0,
      to: 640,
      durationMs: 1000,
      ease: "outElastic",
      onUpdate: (v) => {
        els[2].style.transform = `translateX(${v}px)`;
      },
    });
    const moveD = createAnimation({
      from: 0,
      to: 640,
      durationMs: 600,
      ease: "inOutBack",
      onUpdate: (v) => {
        els[3].style.transform = `translateX(${v}px)`;
      },
    });

    const resetAll = () =>
      els.forEach((el) => {
        el.style.transform = "translateX(0px)";
      });

    const timeline = createTimeline({
      keyframes: [
        { at: 0, animations: [moveA, moveB] },
        { gap: 200, animations: [moveC] },
        { gap: 200, animations: [moveD] },
      ],
      onProgress: (progress) => {
        timeFill.style.width = `${Math.round(progress * 100)}%`;
      },
    });

    const play = () => {
      timeline.play();
      resetAll();
    };

    playBtn.addEventListener("click", play);
    resetBtn.addEventListener("click", () => {
      resetAll();
      playBtn.textContent = "▶ Play";
    });

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
