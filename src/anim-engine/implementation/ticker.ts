import type { AnimEngineInternalApi } from "./anim-engine";

export class Ticker {
  public autoStart: boolean = true;
  #isRunning: boolean = false;
  #lastTime: number;
  #activeAnimEngineQueue: Set<AnimEngineInternalApi> = new Set();
  #inactiveAnimEngines: Set<AnimEngineInternalApi> = new Set();
  public constructor() {
    this.#lastTime = performance.now();
  }

  public start(): void {
    if (this.#isRunning) return;

    this.#isRunning = true;
    this.#updateLoop();
  }

  public stop(): void {
    this.#isRunning = false;
  }

  public activateAnimEngine(animEngine: AnimEngineInternalApi): void {
    this.#activeAnimEngineQueue.add(animEngine);
    this.#inactiveAnimEngines.delete(animEngine);
  }

  public deactivateAnimEngine(animEngine: AnimEngineInternalApi): void {
    this.#activeAnimEngineQueue.delete(animEngine);
    this.#inactiveAnimEngines.add(animEngine);
  }

  public removeAnimEngine(animEngine: AnimEngineInternalApi): void {
    this.#activeAnimEngineQueue.delete(animEngine);
    this.#inactiveAnimEngines.delete(animEngine);
  }

  public update(now: number): void {
    this.#updateFunction(now);
  }

  #updateFunction(now: number): void {
    this.#activeAnimEngineQueue.forEach((animation) => {
      const deltaMs = now - this.#lastTime;

      animation.update(deltaMs);
    });

    this.#lastTime = now;
  }

  #updateLoop = (): void => {
    if (!this.#isRunning) return;

    this.#updateFunction(performance.now());

    requestAnimationFrame(this.#updateLoop);
  };
}
