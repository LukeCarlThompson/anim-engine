import type { Ticker } from "../tween-machine";

export type UpdateableObject = {
  update(deltaMs: number): void;
};

export class TickerInternal implements Ticker {
  public autoStart: boolean = true;
  #isRunning: boolean = false;
  #lastTime?: number;
  #activeObjects: Set<UpdateableObject> = new Set();
  #inactiveObjects: Set<UpdateableObject> = new Set();
  #animationframeRequest?: number;

  public start(): void {
    if (this.#isRunning) return;
    this.#isRunning = true;
    this.#updateLoop();
  }

  public stop(): void {
    this.#isRunning = false;
    this.#lastTime = undefined;
  }

  public activateAnimEngine(animEngine: UpdateableObject): void {
    this.#activeObjects.add(animEngine);
    this.#inactiveObjects.delete(animEngine);

    if (this.autoStart) {
      this.start();
    }
  }

  public deactivateAnimEngine(animEngine: UpdateableObject): void {
    this.#activeObjects.delete(animEngine);
    this.#inactiveObjects.add(animEngine);
  }

  public removeAnimEngine(animEngine: UpdateableObject): void {
    this.#activeObjects.delete(animEngine);
    this.#inactiveObjects.delete(animEngine);
  }

  public update(now: number): void {
    this.#updateFunction(now);
  }

  /**
   * Resets the tickers internal time values. Required for testing.
   */
  public reset(): void {
    this.#lastTime = undefined;
  }

  #updateFunction(now: number): void {
    const deltaMs = now - (this.#lastTime ?? now);

    this.#activeObjects.forEach((animation) => {
      animation.update(deltaMs);
    });

    this.#lastTime = now;
  }

  #updateLoop = (): void => {
    if (!this.#isRunning) return;
    if (this.#animationframeRequest) {
      cancelAnimationFrame(this.#animationframeRequest);
    }

    this.#updateFunction(Date.now());

    if (this.#activeObjects.size === 0) {
      this.stop();
    }

    this.#animationframeRequest = requestAnimationFrame(this.#updateLoop);
  };
}
