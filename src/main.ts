import "./style.css";

import { createAnimEngine, getTicker } from "./anim-engine";

const block: HTMLDivElement | null = document.querySelector(".block");
const appElement: HTMLDivElement | null = document.querySelector("#app");

if (!block || !appElement) {
  throw new Error("unable to find required elements");
}

const ticker = getTicker();
ticker.autoStart = true;

const animateX = createAnimEngine({
  from: 0,
  to: 0,
  ease: "inOutQuart",
});

const animateY = createAnimEngine({
  from: 0,
  to: 0,
  ease: "inOutQuart",
  onUpdate: (value, velocity) => {
    block.style.transform = `translate(${animateX.currentValue}px, ${value}px) scale(${
      Math.abs(animateX.velocity * 0.1) + 1
    }, ${Math.abs(velocity * 0.1) + 1}) rotate(${animateX.velocity * 0.3}deg)`;
  },
});

appElement.addEventListener("click", (e) => {
  animateX.to = e.clientX;
  animateX.from = animateX.currentValue;
  animateY.to = e.clientY;
  animateY.from = animateY.currentValue;
  void animateX.play();
  void animateY.play();
});
