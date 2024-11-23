import { AnimEngine, AnimEngineInternalApi } from "./anim-engine";
import type {
  AnimEngineSequenceApi,
  AnimEngineSequenceOptions,
  AnimEngineStatus,
  NumberOrFunction,
} from "../anim-engine";

import type { Ticker } from "./ticker";
import { getInternalTicker } from "../get-ticker";

export class AnimSequence implements AnimEngineSequenceApi {
  #ticker: Ticker;
  #sequence: AnimEngineInternalApi[];
  #currentValue: number;
  #status: AnimEngineStatus;
  #totalDurationMs: number;

  public constructor(options: AnimEngineSequenceOptions) {
    this.#ticker = getInternalTicker();
    this.#status = "stopped";
    this.#currentValue = this.#getConcreteValue(options.steps[0].from);

    this.#sequence = options.steps.map(({ from, to, durationMs, ease }, i) => {
      return new AnimEngine({
        from: from ?? options.steps[i - 1].to,
        to,
        durationMs,
        ease,
        onUpdate: (currentValue, velocity) => {
          this.#currentValue = currentValue;
          options.onUpdate?.(currentValue, velocity);
        },
      });
    });

    this.#totalDurationMs = this.#sequence.reduce((prev, next) => prev + next.durationMs, 0);
  }

  public get velocity(): number {
    for (let i = 0; i < this.#sequence.length; i++) {
      if (this.#sequence[i].status === "playing") {
        return this.#sequence[i].velocity;
      }
    }

    return 0;
  }
  public get progress(): number {
    const currentProgressMs = this.#sequence.reduce((prev, next) => {
      prev += next.progress * next.durationMs;
      return prev;
    }, 0);

    return currentProgressMs / this.#totalDurationMs;
  }
  public set progress(progress: number) {
    // TODO: How do we set the progress? Or should I just remove this feature?
  }
  public get status(): AnimEngineStatus {
    return this.#status;
  }
  public get currentValue(): number {
    return this.#currentValue;
  }

  public get durationMs(): number {
    return this.#totalDurationMs;
  }

  public async play(): Promise<void> {
    this.#sequence.forEach((step) => (step.progress = 0));
    this.#status = "playing";
    for (let i = 0; i < this.#sequence.length; i++) {
      await this.#sequence[i].play();
    }
    this.#status = "finished";
  }

  public pause(): void {
    this.#status = "paused";
    this.#sequence.forEach((step) => {
      if (step.status === "playing") {
        step.pause();
      }
    });
  }

  public resume(): void {
    this.#sequence.forEach((step) => {
      if (step.status === "paused") {
        this.#status = "playing";
        step.resume();
      }
    });
  }

  public stop(): void {
    this.#sequence.forEach((step) => {
      step.stop();
    });
    this.#status = "stopped";
  }

  public skipToEndOfCurrentStep(): void {
    this.#sequence.forEach((step) => {
      if (step.status === "playing" || step.status === "paused") {
        this.#status = "stopped";
        step.skipToEnd();
      }
    });
  }

  public skipToEnd(): void {
    // BUG: This doesn't work correctly
    // Solve the problem of skipping all steps.
    // If we skip the steps the original play promise doesn't resolve. Try abort controllers.
    this.#sequence.forEach((step) => {
      step.skipToEnd();
    });
  }

  public kill(): void {
    // TODO: Do we need another status for dead? How can we stop this attempting to be revivied?
    // We should remove all references to the AnimEngine instances so they can be cleaned up.
    this.#status = "stopped";
    this.#sequence.forEach((step) => {
      this.#ticker.removeAnimEngine(step);
    });
  }

  #getConcreteValue(numberOrFunction: NumberOrFunction): number {
    if (typeof numberOrFunction === "function") {
      return numberOrFunction();
    }

    return numberOrFunction;
  }
}
