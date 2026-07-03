import type { Meta, StoryObj } from "@storybook/html";
import { createSpring } from "./create-spring";
import { getTicker } from "../ticker/get-ticker";

getTicker().start();

const meta = {
  title: "Spring",
  tags: ["autodocs"],
  argTypes: {
    stiffness: { control: { type: "range", min: 10, max: 500, step: 10 } },
    damping: { control: { type: "range", min: 1, max: 50, step: 1 } },
    mass: { control: { type: "range", min: 0.1, max: 10, step: 0.1 } },
  },
  args: {
    stiffness: 180,
    damping: 12,
    mass: 1,
  },
  render: ({ stiffness, damping, mass }) => {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      gap: 24px; padding: 40px; font-family: sans-serif;
    `;

    const title = document.createElement("h2");
    title.textContent = "Spring Physics";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    // Params display
    const params = document.createElement("div");
    params.style.cssText = "color:#666;font-size:13px;font-family:monospace;";
    params.textContent = `stiffness: ${stiffness}  damping: ${damping}  mass: ${mass}`;
    container.appendChild(params);

    // Track
    const track = document.createElement("div");
    track.style.cssText = `
      display: flex; align-items: center; padding-left: 30px;
      width: 700px; height: 100px;
      background: #2a2a3d; border-radius: 8px;
    `;

    const block = document.createElement("div");
    block.style.cssText = `
      width: 50px; height: 50px; border-radius: 8px;
      background: linear-gradient(135deg, #98c379, #56ab2f);
      transform: translateX(0px);
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
    controls.style.cssText = "display:flex;gap:12px;";

    const playBtn = document.createElement("button");
    playBtn.textContent = "▶ Play";
    playBtn.style.cssText = `
      padding:8px 24px;border:1px solid #98c379;border-radius:6px;
      background:transparent;color:#98c379;cursor:pointer;font-size:14px;min-width:100px;
    `;

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "↺ Reset";
    resetBtn.style.cssText =
      "padding:8px 16px;border:1px solid #555;border-radius:6px;background:transparent;color:#888;cursor:pointer;font-size:14px;";

    controls.appendChild(playBtn);
    controls.appendChild(resetBtn);
    container.appendChild(controls);

    let spring: ReturnType<typeof createSpring> | null = null;

    const reset = () => {
      block.style.transform = "translateX(0px)";
      velocityFill.style.width = "0%";
      velocityValue.textContent = "0.00";
    };

    const play = () => {
      if (spring) {
        spring.kill();
      }
      reset();

      spring = createSpring({
        from: 0,
        to: 620,
        stiffness,
        damping,
        mass,
        onUpdate: (value, velocity) => {
          block.style.transform = `translateX(${value}px)`;

          const absVel = Math.abs(velocity);
          const barPercent = Math.min(absVel * 0.4, 100);
          velocityFill.style.width = `${barPercent}%`;
          velocityFill.style.left = velocity >= 0 ? "50%" : `${50 - barPercent}%`;
          velocityFill.style.background = velocity >= 0 ? "#98c379" : "#e06c75";
          velocityValue.textContent = velocity.toFixed(2);
        },
        onEnded: () => {
          spring = null;
          playBtn.textContent = "▶ Play";
        },
      });

      // Spring auto-starts on creation — no play() needed
      playBtn.textContent = "⏸ Pause";
    };

    const togglePlay = () => {
      if (!spring) {
        play();
        return;
      }
      if (spring.status === "active") {
        spring.stop();
        playBtn.textContent = "▶ Resume";
      } else {
        spring.start();
        playBtn.textContent = "⏸ Pause";
      }
    };

    playBtn.addEventListener("click", togglePlay);
    resetBtn.addEventListener("click", () => {
      if (spring) {
        spring.kill();
        spring = null;
      }
      reset();
      playBtn.textContent = "▶ Play";
    });

    return container;
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
