import type { Meta, StoryObj } from "@storybook/html";
import { fn } from "@storybook/test";
import { Pane } from "tweakpane";
import { EASE_NAMES } from "./easing";

import { createSequence } from "../create-sequence";
import { addTweakpaneControls } from "./add-controls.tweakpane";

import type { AnimEngineOptions } from "../anim-engine";

const meta = {
  title: "Example/AnimSequence",
  tags: ["autodocs"],
  render: ({ from, to, ease, durationMs, onEnded, onStarted, onRepeat }) => {
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.height = "100vh";
    container.style.width = "100%";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";

    const block = document.createElement("div");
    block.style.height = "100px";
    block.style.width = "100px";
    block.style.backgroundColor = "cornflowerblue";

    container.appendChild(block);

    const sequence = createSequence({
      steps: [
        {
          from,
          to,
          ease,
          durationMs,
        },
        {
          to: 200,
          ease: "inOutQuart",
        },
        {
          to: 300,
          ease: "inQuad",
        },
        {
          to: 400,
          ease: "outElastic",
        },
      ],
      onEnded,
      onStarted,
      onRepeat,
      onUpdate: (value, velocity) => {
        block.style.transform = `translateX(${value}px) rotate(${velocity}deg)`;
      },
    });

    const tweakpane = new Pane();
    tweakpane.element.style.position = "absolute";
    tweakpane.element.style.top = "10px";
    tweakpane.element.style.right = "10px";

    container.appendChild(tweakpane.element);

    addTweakpaneControls(sequence, tweakpane);

    return container;
  },
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    from: { control: "number" },
    to: { control: "number" },
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
    from: -100,
    to: 100,
    durationMs: 1000,
    ease: "inOutQuad",
    repeat: 0,
    onStarted: fn(),
    onEnded: fn(),
    onRepeat: fn(),
  },
};
