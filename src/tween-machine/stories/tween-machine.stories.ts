import type { Meta, StoryObj } from "@storybook/html";
import { fn } from "@storybook/test";
import { Pane } from "tweakpane";
import { createTween } from "../create-tween";
import { EASE_NAMES } from "../tween-implementation";

import type { TweenOptions } from "../tween-machine";
import { addTweakpaneControls } from "./add-controls.tweakpane";

const meta = {
  title: "Example/Create Tween",
  tags: ["autodocs"],
  render: ({ ease, durationMs, onEnded, onStarted }) => {
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
    block.style.backgroundColor = "pink";

    container.appendChild(block);

    const target = {
      x: 0,
      y: 0,
      string: "string",
    };

    const tween = createTween(target, {
      to: {
        x: 400,
        y: 400,
      },
      ease,
      durationMs,
      onStarted,
      onEnded,
      onUpdate: (value, velocity) => {
        block.style.transform = `translateX(${value.x}px) rotate(${velocity.x}deg)`;
      },
    });

    const tweakpane = new Pane();
    tweakpane.element.style.position = "absolute";
    tweakpane.element.style.top = "10px";
    tweakpane.element.style.right = "10px";

    container.appendChild(tweakpane.element);

    addTweakpaneControls(tween, tweakpane);

    return container;
  },
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    to: { control: "number" },
    durationMs: { control: "number" },
    ease: {
      control: "select",
      options: EASE_NAMES,
    },
  },
} satisfies Meta<TweenOptions>;

export default meta;
type Story = StoryObj<TweenOptions>;

export const Primary: Story = {
  name: "Tween Machine",
  args: {
    durationMs: 1000,
    ease: "inOutQuad",
    onStarted: fn(),
    onEnded: fn(),
  },
};
