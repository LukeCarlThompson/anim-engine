import "./style.scss";

import { createSequence } from "./anim-engine/create-sequence";

const block: HTMLDivElement | null = document.querySelector(".block");
const appElement: HTMLDivElement | null = document.querySelector("#app");

if (!block || !appElement) {
  throw new Error("unable to find required elements");
}

const sequence = createSequence({
  steps: [
    {
      from: 0,
      to: 90,
      ease: "inQuart",
    },
    {
      to: 180,
      ease: "outQuart",
      durationMs: 1000,
    },
    {
      to: 0,
      ease: "outElastic",
      durationMs: 3000,
    },
  ],
  onUpdate: (value, velocity) => {
    block.style.transform = `rotate(${value}deg) scale(${1 + Math.abs(velocity) * 0.1})`;
  },
});

await sequence.play();
