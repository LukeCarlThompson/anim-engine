import { animate, getTicker } from ".";

const app = document.getElementById("app");
if (!app) throw new Error("no app element");

const block = document.createElement("div");
block.style.cssText =
  "width:100px;height:100px;background:cornflowerblue;border-radius:10px;margin:auto;margin-top:40vh;";
app.appendChild(block);

getTicker();

const tween = animate({
  from: 0,
  to: 300,
  durationMs: 1000,
  ease: "outElastic",
  onUpdate: (v) => {
    block.style.transform = `translateX(${v}px)`;
  },
});

void tween.play();
