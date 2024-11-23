import type { AnimEngineInternalApi } from "./anim-engine";
import type { TickerApi } from "../anim-engine";

export class Ticker implements TickerApi {
  public autoStart: boolean = true;
  #isRunning: boolean = false;
  #lastTime?: number;
  #activeAnimEngineQueue: Set<AnimEngineInternalApi> = new Set();
  #inactiveAnimEngines: Set<AnimEngineInternalApi> = new Set();

  public start(): void {
    if (this.#isRunning) return;

    this.#isRunning = true;
    this.#updateLoop();
  }

  public stop(): void {
    this.#isRunning = false;
    this.#lastTime = undefined;
  }

  public activateAnimEngine(animEngine: AnimEngineInternalApi): void {
    this.#activeAnimEngineQueue.add(animEngine);
    this.#inactiveAnimEngines.delete(animEngine);

    if (this.autoStart) {
      this.start();
    }
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
    const deltaMs = now - (this.#lastTime ?? now);

    this.#activeAnimEngineQueue.forEach((animation) => {
      animation.update(deltaMs);
    });

    this.#lastTime = now;
  }

  #updateLoop = (): void => {
    if (!this.#isRunning) return;

    this.#updateFunction(Date.now());

    if (this.#activeAnimEngineQueue.size === 0) {
      this.stop();
    }

    requestAnimationFrame(this.#updateLoop);
  };
}
