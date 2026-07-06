import type { Meta, StoryObj } from "@storybook/html-vite";

import { createAnimation } from "../animation/create-animation";
import type { Animation } from "../domain";
import { cubicBezier } from "./easing";
import { getTicker } from "./ticker";

getTicker().start();

const meta = {
  title: "Cubic Bezier",
  argTypes: {
    p1x: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    p1y: { control: { type: "range", min: -1, max: 1.5, step: 0.01 } },
    p2x: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    p2y: { control: { type: "range", min: -1, max: 1.5, step: 0.01 } },
    durationMs: { control: { type: "range", min: 200, max: 5000, step: 100 } },
  },
  args: {
    p1x: 0.42,
    p1y: 0,
    p2x: 0.58,
    p2y: 1,
    durationMs: 2000,
  },
  render: ({ p1x, p1y, p2x, p2y, durationMs }) => {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      gap: 24px; padding: 40px; font-family: sans-serif;
    `;

    const title = document.createElement("h2");
    title.textContent = "Cubic Bezier Editor";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    // Canvas for curve preview + draggable control points
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 350;
    canvas.style.cssText = "border-radius:8px;background:#1e1e2e;cursor:crosshair;";
    const ctx = canvas.getContext("2d")!;

    // Control point state (closure variables, updated by sliders)
    let currentP1x = p1x;
    let currentP1y = p1y;
    let currentP2x = p2x;
    let currentP2y = p2y;

    // Slider refs for redraw
    const sliders: HTMLInputElement[] = [];

    const drawCurve = () => {
      const w = canvas.width;
      const h = canvas.height;
      const pad = 40;
      const plotW = w - pad * 2;
      const plotH = h - pad * 2;

      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "#2a2a3d";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const x = pad + (plotW * i) / 4;
        const y = pad + (plotH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x, pad);
        ctx.lineTo(x, pad + plotH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(pad + plotW, y);
        ctx.stroke();
      }

      // Build the ease function
      const ease = cubicBezier(currentP1x, currentP1y, currentP2x, currentP2y);

      // Plot the curve
      ctx.strokeStyle = "#667eea";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = 0; px <= plotW; px++) {
        const t = px / plotW;
        const y = ease(t);
        const canvasX = pad + px;
        const canvasY = pad + plotH - y * plotH;
        if (px === 0) ctx.moveTo(canvasX, canvasY);
        else ctx.lineTo(canvasX, canvasY);
      }
      ctx.stroke();

      // Reference diagonal (linear)
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad, pad + plotH);
      ctx.lineTo(pad + plotW, pad);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = "#555";
      ctx.font = "11px monospace";
      ctx.fillText("0", pad - 14, pad + plotH + 4);
      ctx.fillText("1", pad - 14, pad - 4);
      ctx.textAlign = "center";
      ctx.fillText("0", pad, pad + plotH + 18);
      ctx.fillText("1", pad + plotW, pad + plotH + 18);
      ctx.textAlign = "left";

      // Convert control points to canvas coords
      const toCanvas = (x: number, y: number) => ({
        cx: pad + x * plotW,
        cy: pad + plotH - y * plotH,
      });

      const p1 = toCanvas(currentP1x, currentP1y);
      const p2 = toCanvas(currentP2x, currentP2y);

      // Handle lines
      const p0 = toCanvas(0, 0);
      const p3 = toCanvas(1, 1);

      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p0.cx, p0.cy);
      ctx.lineTo(p1.cx, p1.cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p3.cx, p3.cy);
      ctx.lineTo(p2.cx, p2.cy);
      ctx.stroke();

      // Control points
      const drawHandle = (cx: number, cy: number, label: string) => {
        ctx.fillStyle = "#e06c75";
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, cx, cy - 16);
        ctx.textAlign = "left";
      };
      drawHandle(p1.cx, p1.cy, "P1");
      drawHandle(p2.cx, p2.cy, "P2");

      // CSS preset label
      const cssStr = `cubic-bezier(${currentP1x.toFixed(2)}, ${currentP1y.toFixed(2)}, ${currentP2x.toFixed(2)}, ${currentP2y.toFixed(2)})`;
      ctx.fillStyle = "#666";
      ctx.font = "12px monospace";
      ctx.fillText(cssStr, pad, 18);
    };

    drawCurve();
    container.appendChild(canvas);

    // Sliders
    const makeSlider = (
      label: string,
      min: number,
      max: number,
      step: number,
      initial: number,
      onChange: (v: number) => void,
    ) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:10px;width:500px;";

      const lbl = document.createElement("span");
      lbl.textContent = label;
      lbl.style.cssText = "min-width:28px;color:#888;font-size:13px;font-family:monospace;";

      const input = document.createElement("input");
      input.type = "range";
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(initial);
      input.style.cssText = "flex:1;accent-color:#667eea;";

      const val = document.createElement("span");
      val.textContent = initial.toFixed(2);
      val.style.cssText =
        "min-width:50px;color:#a8e063;font-size:13px;font-family:monospace;text-align:right;";

      input.addEventListener("input", () => {
        const v = parseFloat(input.value);
        val.textContent = v.toFixed(2);
        onChange(v);
        drawCurve();
      });

      row.appendChild(lbl);
      row.appendChild(input);
      row.appendChild(val);

      sliders.push(input);
      container.appendChild(row);
    };

    makeSlider("P1x", 0, 1, 0.01, currentP1x, (v) => {
      currentP1x = v;
    });
    makeSlider("P1y", -1, 1.5, 0.01, currentP1y, (v) => {
      currentP1y = v;
    });
    makeSlider("P2x", 0, 1, 0.01, currentP2x, (v) => {
      currentP2x = v;
    });
    makeSlider("P2y", -1, 1.5, 0.01, currentP2y, (v) => {
      currentP2y = v;
    });

    // Preset buttons
    const presets = document.createElement("div");
    presets.style.cssText =
      "display:flex;gap:8px;flex-wrap:wrap;justify-content:center;width:500px;";

    const presetDefs: Array<{ label: string; p1x: number; p1y: number; p2x: number; p2y: number }> =
      [
        { label: "Ease", p1x: 0.25, p1y: 0.1, p2x: 0.25, p2y: 1 },
        { label: "Ease In", p1x: 0.42, p1y: 0, p2x: 1, p2y: 1 },
        { label: "Ease Out", p1x: 0, p1y: 0, p2x: 0.58, p2y: 1 },
        { label: "Ease In Out", p1x: 0.42, p1y: 0, p2x: 0.58, p2y: 1 },
        { label: "Snap", p1x: 0.25, p1y: 1.25, p2x: 0.75, p2y: -0.25 },
        { label: "Linear", p1x: 0, p1y: 0, p2x: 1, p2y: 1 },
      ];

    for (const preset of presetDefs) {
      const btn = document.createElement("button");
      btn.textContent = preset.label;
      btn.style.cssText = `
        padding: 4px 12px; border: 1px solid #555; border-radius: 4px;
        background: transparent; color: #aaa; cursor: pointer; font-size: 12px; font-family: monospace;
      `;
      btn.addEventListener("click", () => {
        currentP1x = preset.p1x;
        currentP1y = preset.p1y;
        currentP2x = preset.p2x;
        currentP2y = preset.p2y;

        // Update sliders
        const vals = [currentP1x, currentP1y, currentP2x, currentP2y];
        sliders.forEach((s, i) => {
          s.value = String(vals[i]);
          // Trigger the label update
          const evt = new Event("input", { bubbles: true });
          s.dispatchEvent(evt);
        });

        drawCurve();
      });
      presets.appendChild(btn);
    }
    container.appendChild(presets);

    // Track + block
    const track = document.createElement("div");
    track.style.cssText = `
      display: flex; align-items: center; padding-left: 50px;
      width: 500px; height: 80px;
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
      "width:500px;height:4px;background:#2a2a3d;border-radius:2px;overflow:hidden;";
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

    const returnBtn = document.createElement("button");
    returnBtn.textContent = "↺ Return";
    returnBtn.style.cssText = `
      padding:8px 16px;border:1px solid #555;border-radius:6px;
      background:transparent;color:#888;cursor:pointer;font-size:14px;
    `;

    controls.appendChild(playBtn);
    controls.appendChild(returnBtn);
    container.appendChild(controls);

    let anim: Animation | undefined = undefined;

    const resetPosition = () => {
      block.style.transform = "translateX(0px)";
      progressFill.style.width = "0%";
    };

    const getEase = () => cubicBezier(currentP1x, currentP1y, currentP2x, currentP2y);

    const play = () => {
      if (anim) {
        anim.kill();
      }
      resetPosition();

      anim = createAnimation({
        from: 0,
        to: 400,
        durationMs,
        ease: getEase(),
        onUpdate: (value) => {
          block.style.transform = `translateX(${value}px)`;
          if (anim) {
            progressFill.style.width = `${anim.progress * 100}%`;
          }
        },
        onEnded: () => {
          anim = undefined;
          playBtn.textContent = "▶ Play";
          progressFill.style.width = "100%";
        },
      });

      void anim.play();
      playBtn.textContent = "⏸ Pause";
    };

    const togglePlay = () => {
      if (!anim || (anim.status !== "playing" && anim.status !== "paused")) {
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
    returnBtn.addEventListener("click", () => {
      const start = anim ? anim.currentValue : 400;
      if (anim) {
        anim.kill();
      }
      anim = createAnimation({
        from: start,
        to: 0,
        durationMs,
        ease: getEase(),
        onUpdate: (value) => {
          block.style.transform = `translateX(${value}px)`;
          if (anim) {
            progressFill.style.width = `${anim.progress * 100}%`;
          }
        },
        onEnded: () => {
          anim = undefined;
          playBtn.textContent = "▶ Play";
        },
      });
      void anim.play();
      playBtn.textContent = "⏸ Pause";
    });

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
