import "./style.css";

import { createAnimEngine, getTicker } from "./anim-engine";

const block: HTMLDivElement | null = document.querySelector(".block");
const appElement: HTMLDivElement | null = document.querySelector("#app");

if (!block || !appElement) {
  throw new Error("unable to find required elements");
}

const ticker = getTicker();
ticker.autoStart = true;

const animation = createAnimEngine({
  from: 0,
  to: 200,
  durationMs: 2000,
  ease: "outQuart",
  onUpdate: (value: number) => {
    block.style.transform = `translateX(${value}px)`;
  },
});

appElement.addEventListener("click", (e) => {
  animation.to = e.clientX;
  animation.from = animation.currentValue;
  void animation.play();
});
