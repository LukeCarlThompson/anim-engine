import type { AnimEngineApi, AnimEngineSequenceApi } from "../anim-engine";

import type { Pane } from "tweakpane";

export const addTweakpaneControls = (animEngine: AnimEngineApi | AnimEngineSequenceApi, pane: Pane): void => {
  pane.addButton({ title: "play" }).on("click", () => {
    void animEngine.play();
  });

  pane.addButton({ title: "stop" }).on("click", () => {
    animEngine.stop();
  });

  pane.addButton({ title: "pause" }).on("click", () => {
    animEngine.pause();
  });

  pane.addButton({ title: "resume" }).on("click", () => {
    animEngine.resume();
  });

  pane.addButton({ title: "kill" }).on("click", () => {
    animEngine.kill();
  });

  if ("skipToEndOfCurrentStep" in animEngine) {
    pane.addButton({ title: "skip to end of step" }).on("click", () => {
      animEngine.skipToEndOfCurrentStep();
    });
  }

  pane.addButton({ title: "skip to end" }).on("click", () => {
    animEngine.skipToEnd();
  });

  pane.addBinding(animEngine, "currentValue", {
    readonly: true,
    view: "graph",
    min: -100,
    max: 100,
  });

  pane.addBinding(animEngine, "currentValue", {
    label: "currentValue",
    readonly: true,
    interval: 10,
  });

  pane.addBinding(animEngine, "progress", {
    label: "progress",
    readonly: true,
    view: "graph",
    min: 0,
    max: 1,
  });

  pane.addBinding(animEngine, "progress", {
    label: "progress",
    readonly: true,
    interval: 5,
  });

  pane.addBinding(animEngine, "velocity", {
    label: "velocity",
    readonly: true,
    interval: 10,
  });
};
