import type { PickByType, Tween, TweenSequence, TweenSequenceOptions, TweenTarget } from "../tween-machine";

import { TweenImplementation } from "./tween-implementation";

export type TweenSequenceProps<Target extends TweenTarget> = {
  target: Target;
} & TweenSequenceOptions<Target>;

export class TweenSequenceImplementation<Target extends TweenTarget> implements TweenSequence {
  #target: Target;
  #onStarted?: (startValue: PickByType<Target, number>) => void;
  #onUpdate?: (currentValue: PickByType<Target, number>, velocity: PickByType<Target, number>) => void;
  #onEnded?: (endValue: PickByType<Target, number>) => void;
  #sequence: Tween[];
  #totalDurationMs: number;
  #skipToEndController?: AbortController;
  #stopController?: AbortController;
  #currentStep?: Tween;

  public constructor({ target, onStarted, onUpdate, onEnded, steps }: TweenSequenceProps<Target>) {
    this.#target = target;

    this.#onStarted = onStarted;
    this.#onUpdate = onUpdate;
    this.#onEnded = onEnded;

    this.#totalDurationMs = steps.reduce((prev, next) => prev + (next.durationMs ?? 0), 0);

    this.#sequence = steps.map(({ to, durationMs, ease }) => {
      // How to get each step to start from the ending point of the previous step?
      return new TweenImplementation({ target, to, durationMs, ease, onUpdate: this.#onUpdate });
    });
  }

  public async play(): Promise<void> {
    this.#skipToEndController = new AbortController();
    this.#skipToEndController.signal.addEventListener("abort", () => {
      for (let i = 0; i < this.#sequence.length; i++) {
        this.#sequence[i].skipToEnd();
      }
      this.#currentStep = undefined;
    });

    this.#stopController = new AbortController();
    this.#stopController.signal.addEventListener("abort", () => {
      for (let i = 0; i < this.#sequence.length; i++) {
        this.#sequence[i].stop();
      }
      this.#currentStep = undefined;
    });

    this.#sequence.forEach((step) => (step.progress = 0));
    // TODO: Pass only the animating values not the whole target object
    this.#onStarted?.(this.#target);

    for (let i = 0; i < this.#sequence.length; i++) {
      this.#currentStep = this.#sequence[i];
      const playPromise = this.#currentStep.play();
      // if (this.#skipToEndController.signal.aborted) {
      //   this.#sequence[i].skipToEnd();
      // }
      // if (this.#stopController.signal.aborted) {
      //   this.#sequence[i].stop();
      // }
      await playPromise;
    }

    // TODO: Pass only the animating values not the whole target object
    this.#onEnded?.(this.#target);
  }

  public pause(): void {
    this.#currentStep?.pause();
  }

  public resume(): void {
    this.#currentStep?.resume();
  }

  public stop(): void {
    this.#stopController?.abort();
  }

  public skipToEndOfCurrentStep(): void {
    this.#currentStep?.skipToEnd();
  }

  public skipToEnd(): void {
    this.#skipToEndController?.abort();
  }

  public kill(): void {
    this.#sequence.forEach((step) => {
      step.kill();
    });
    this.#currentStep = undefined;
    this.#sequence.length = 0;
  }

  public get progress(): number {
    // const currentProgressMs = this.#sequence.reduce((prev, next, i) => {
    //   prev += next.progress * this.#steps[i].durationMs;
    //   return prev;
    // }, 0);

    // return currentProgressMs / this.#totalDurationMs;

    // TODO: How do we get the current progress

    return 0;
  }
  public set progress(progress: number) {
    void progress;
    // TODO: How do we set the progress? Or should I just remove this feature?
  }
}
