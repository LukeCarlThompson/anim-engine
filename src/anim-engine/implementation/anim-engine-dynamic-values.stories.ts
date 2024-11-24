import type { Meta, StoryObj } from "@storybook/html";
import { fn } from "@storybook/test";
import { Pane } from "tweakpane";
import { EASE_NAMES } from "./easing";

import { createAnimEngine } from "../create-anim-engine";
import { addTweakpaneControls } from "./add-controls.tweakpane";

import type { AnimEngineOptions } from "../anim-engine";

const meta = {
  title: "Example/AnimEngine function value",
  tags: ["autodocs"],
  render: ({ ease, durationMs, onEnded, onStarted, onRepeat }) => {
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.height = "100vh";
    container.style.width = "100%";
    container.style.display = "flex";
    container.style.alignItems = "center";

    const target = document.createElement("div");
    target.style.display = "flex";
    target.style.alignItems = "center";
    target.style.justifyContent = "center";
    target.style.height = "40px";
    target.style.width = "40px";
    target.style.left = "200px";
    target.style.backgroundColor = "red";
    target.style.borderRadius = "100px";
    target.style.position = "absolute";
    target.style.zIndex = "1";
    target.style.cursor = "grab";
    target.style.fontWeight = "bold";
    target.style.color = "white";
    target.style.userSelect = "none";
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    target.style.webkitUserSelect = "none";
    target.style.boxShadow = "0 10px 10px -5px rgba(0, 0, 0, 0.3)";
    target.innerHTML = "<-->";
    container.appendChild(target);

    let isGrabbing = false;
    target.addEventListener("mousedown", () => {
      isGrabbing = true;
    });
    container.addEventListener("mouseup", () => {
      isGrabbing = false;
    });

    container.addEventListener("mousemove", (e) => {
      if (!isGrabbing) return;
      // const topOffset = e.clientY - container.getBoundingClientRect().top - 20;
      // target.style.top = `${topOffset}px`;
      const leftOffset = e.clientX - container.getBoundingClientRect().left - 20;
      target.style.left = `${leftOffset}px`;
    });

    const block = document.createElement("div");
    block.style.height = "100px";
    block.style.width = "100px";
    block.style.backgroundColor = "cornflowerblue";

    container.appendChild(block);

    const animEngine = createAnimEngine({
      from: () => {
        return block.getBoundingClientRect().left - container.getBoundingClientRect().left;
      },
      to: () => {
        return target.getBoundingClientRect().left - container.getBoundingClientRect().left - 30;
      },
      ease,
      durationMs,
      onStarted,
      onRepeat,
      onEnded,
      onUpdate: (value, velocity) => {
        // TODO: Use the array of values to set the x and y coords of the block when that feature has been implemented.
        block.style.transform = `translateX(${value}px) rotate(${velocity}deg)`;
      },
    });

    const tweakpane = new Pane();
    tweakpane.element.style.position = "absolute";
    tweakpane.element.style.top = "10px";
    tweakpane.element.style.right = "10px";

    container.appendChild(tweakpane.element);

    addTweakpaneControls(animEngine, tweakpane);

    return container;
  },
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    durationMs: { control: "number" },
    ease: {
      control: "select",
      options: EASE_NAMES,
    },
  },
} satisfies Meta<AnimEngineOptions>;

export default meta;
type Story = StoryObj<AnimEngineOptions>;

export const Primary: Story = {
  name: "Anim Engine",
  args: {
    durationMs: 1000,
    ease: "inOutQuad",
    repeat: 0,
    onStarted: fn(),
    onEnded: fn(),
    onRepeat: fn(),
  },
};
