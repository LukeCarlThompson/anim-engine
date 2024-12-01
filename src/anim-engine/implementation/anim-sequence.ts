import type {
  AnimEngineSequenceApi,
  AnimEngineSequenceOptions,
  AnimEngineStatus,
  NumberOrFunction,
} from "../anim-engine";

import { AnimEngine } from "./anim-engine";
import type { AnimEngineInternalApi } from "./anim-engine";

export class AnimSequence implements AnimEngineSequenceApi {
  #sequence: AnimEngineInternalApi[];
  #currentValue: number;
  #status: AnimEngineStatus;
  #totalDurationMs: number;
  #skipToEndController?: AbortController;
  #stopController?: AbortController;

  public constructor(options: AnimEngineSequenceOptions) {
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
    void progress;
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
    if (this.#status === "dead") {
      throw new Error("Unable to play animation sequence as it has previously been killed.");
    }

    this.#skipToEndController = new AbortController();
    this.#skipToEndController.signal.addEventListener("abort", () => {
      for (let i = 0; i < this.#sequence.length; i++) {
        this.#sequence[i].skipToEnd();
      }
    });

    this.#stopController = new AbortController();
    this.#stopController.signal.addEventListener("abort", () => {
      for (let i = 0; i < this.#sequence.length; i++) {
        this.#sequence[i].stop();
      }
    });

    this.#sequence.forEach((step) => (step.progress = 0));
    this.#status = "playing";

    for (let i = 0; i < this.#sequence.length; i++) {
      const playPromise = this.#sequence[i].play();
      if (this.#skipToEndController.signal.aborted) {
        this.#sequence[i].skipToEnd();
      }
      if (this.#stopController.signal.aborted) {
        this.#sequence[i].stop();
      }
      await playPromise;
    }
    this.#status = "stopped";
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
    this.#stopController?.abort();
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
    this.#skipToEndController?.abort();
  }

  public kill(): void {
    this.#status = "dead";
    this.#sequence.forEach((step) => {
      step.kill();
    });
    this.#sequence.length = 0;
  }

  #getConcreteValue(numberOrFunction: NumberOrFunction): number {
    if (typeof numberOrFunction === "function") {
      return numberOrFunction();
    }

    return numberOrFunction;
  }
}
