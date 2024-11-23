import "./style.scss";

import { createAnimEngine } from "./anim-engine";
import { createSequence } from "./anim-engine/create-sequence";

const block: HTMLDivElement | null = document.querySelector(".block");
const appElement: HTMLDivElement | null = document.querySelector("#app");

if (!block || !appElement) {
  throw new Error("unable to find required elements");
}

// const ticker = getTicker();
// ticker.autoStart = true;

const sequence = createSequence({
  steps: [
    {
      from: 0,
      to: 100,
      ease: "inQuart",
    },
    {
      to: 200,
      ease: "outElastic",
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
  onUpdate: (value, velocity) => {
    block.style.transform = `translateX(${value}px)`;

    // TODO: Fix the velocity between sequences
    // block.style.transform = `translateX(${value}px) scale(${Math.abs(velocity * 0.1) + 1}, ${
    //   Math.abs(velocity * 0.1) + 1
    // }) rotate(${velocity * 0.3}deg)`;
  },
});

const sequenceDown = createSequence({
  steps: [
    {
      from: 0,
      to: 100,
      ease: "inQuart",
    },
    {
      to: 200,
      ease: "outElastic",
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
  onUpdate: (value, velocity) => {
    block.style.transform = `translate(${sequence.currentValue}px, ${value}px)`;

    // TODO: Fix the velocity between sequences
    // block.style.transform = `translateX(${value}px) scale(${Math.abs(velocity * 0.1) + 1}, ${
    //   Math.abs(velocity * 0.1) + 1
    // }) rotate(${velocity * 0.3}deg)`;
  },
});

void sequence.play().then(() => {
  void sequenceDown.play();
});

const animateX = createAnimEngine({
  from: 0,
  to: 100,
  ease: "inOutQuart",
  durationMs: 3000,
  onUpdate: (value) => {
    console.log("🍩 update single -->", value);
  },
});

// void animateX.play();

// const animateY = createAnimEngine({
//   from: 0,
//   to: 0,
//   ease: "inOutQuart",
//   onUpdate: (value, velocity) => {
//     block.style.transform = `translate(${animateX.currentValue}px, ${value}px) scale(${
//       Math.abs(animateX.velocity * 0.1) + 1
//     }, ${Math.abs(velocity * 0.1) + 1}) rotate(${animateX.velocity * 0.3}deg)`;
//   },
// });

// appElement.addEventListener("click", (e) => {
//   animateX.to = e.clientX;
//   animateX.from = animateX.currentValue;
//   animateY.to = e.clientY;
//   animateY.from = animateY.currentValue;
//   void animateX.play();
//   void animateY.play();
// });
