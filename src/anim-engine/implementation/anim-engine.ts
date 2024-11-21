import type { AnimEngineApi, AnimEngineOptions, AnimEngineStatus, EaseName, NumberOrFunction } from "../anim-engine";
import { easingFunctions } from "./easing";

export type AnimEngineInternalApi = AnimEngineApi & {
  get duration(): number;
  get progress(): number;
  readonly update: (delta: number) => void;
};

export type AnimEngineInternalOptions = AnimEngineOptions & {
  activate: (animEngine: AnimEngineInternalApi) => void;
  deactivate: (animEngine: AnimEngineInternalApi) => void;
  removeFromTicker: (animEngine: AnimEngineInternalApi) => void;
};

export class AnimEngine implements AnimEngineInternalApi {
  #timeProgressFraction = 0;
  #status: AnimEngineStatus = "stopped";
  #to: NumberOrFunction;
  #toCurrentValue: number = 0;
  #from: NumberOrFunction;
  #fromCurrentValue: number = 0;
  #currentValue: number = 0;
  #durationMs: number;
  #easeName: EaseName;
  #repeatNumber: number;
  #onStarted?: (startValue: number) => void;
  #onUpdate?: (currentValue: number) => void;
  #onEnded?: (endValue: number) => void;
  #onRepeat?: (startValue: number) => void;
  #playResolver?: (value: this | PromiseLike<this>) => void;
  #repeatCounter: number = 0;
  #activate: (animEngine: AnimEngineInternalApi) => void;
  #deactivate: (animEngine: AnimEngineInternalApi) => void;
  #removeFromTicker: (animEngine: AnimEngineInternalApi) => void;

  public constructor({
    to,
    from,
    durationMs = 1000,
    ease = "inOutSine",
    repeat = 0,
    onStarted,
    onUpdate,
    onEnded,
    onRepeat,
    activate,
    deactivate,
    removeFromTicker,
  }: AnimEngineInternalOptions) {
    this.#to = to;
    this.#from = from;
    this.#durationMs = durationMs;
    this.#easeName = ease;
    this.#repeatNumber = repeat;
    this.#onStarted = onStarted;
    this.#onUpdate = onUpdate;
    this.#onEnded = onEnded;
    this.#onRepeat = onRepeat;
    this.#activate = activate;
    this.#deactivate = deactivate;
    this.#removeFromTicker = removeFromTicker;
  }

  public play(): Promise<AnimEngineApi> {
    if (typeof this.#from === "function") {
      this.#fromCurrentValue = this.#from();
      this.#currentValue = this.#from();
    } else {
      this.#fromCurrentValue = this.#from;
    }

    if (typeof this.#to === "function") {
      this.#toCurrentValue = this.#to();
    } else {
      this.#toCurrentValue = this.#to;
    }
    this.#status = "playing";
    this.#activate(this);

    const promise = new Promise<this>((resolve) => {
      this.#playResolver = resolve;
    });
    this.#onStarted?.(this.#fromCurrentValue);

    return promise;
  }

  public pause(): void {
    if (this.#status !== "playing") return;
    this.#status = "paused";
    this.#deactivate(this);
  }

  public resume(): void {
    if (this.#status !== "paused") return;
    this.#status = "playing";
    this.#activate(this);
  }

  public stop(): void {
    if (this.#status !== "paused" && this.#status === "playing") return;
    this.#status = "stopped";
    this.#deactivate(this);

    this.#playResolver?.(this);
  }

  public kill(): void {
    this.#removeFromTicker(this);
  }

  public set to(to: NumberOrFunction) {
    if (this.#status === "playing") {
      this.#timeProgressFraction = 0;
    }
    this.#to = to;
  }

  public set from(from: NumberOrFunction) {
    this.#from = from;
  }

  public get progress(): number {
    return this.#timeProgressFraction;
  }

  public set progress(progress: number) {
    this.#timeProgressFraction = progress;
  }

  public get status(): AnimEngineStatus {
    return this.#status;
  }

  public get duration(): number {
    return this.#durationMs;
  }

  public get currentValue(): number {
    return this.#currentValue;
  }

  public update(deltaMs: number): void {
    const thisUpdateTimeProgressFraction = deltaMs / this.#durationMs;

    this.#timeProgressFraction += thisUpdateTimeProgressFraction;

    // If we are over 1 progress then finish
    if (this.#timeProgressFraction >= 1) {
      this.#currentValue = this.#toCurrentValue;

      if (this.#repeatNumber < this.#repeatCounter) {
        this.#repeatCounter++;
        this.#onUpdate?.(this.#currentValue);
        this.#repeat();
        return;
      }

      this.#onUpdate?.(this.#currentValue);
      this.#status = "finished";
      this.#timeProgressFraction = 0;
      this.#deactivate(this);
      this.#onEnded?.(this.#currentValue);
      this.#playResolver?.(this);
      return;
    }

    const easedProgressFraction = easingFunctions[this.#easeName](this.#timeProgressFraction);
    const distance = this.#toCurrentValue - this.#fromCurrentValue;
    this.#currentValue = this.#fromCurrentValue + distance * easedProgressFraction;
    this.#onUpdate?.(this.#currentValue);
  }

  #repeat(): void {
    if (typeof this.#from === "function") {
      this.#fromCurrentValue = this.#from();
      this.#currentValue = this.#from();
    }
    if (typeof this.#to === "function") {
      this.#toCurrentValue = this.#to();
    }

    this.#timeProgressFraction = 0;

    this.#onRepeat?.(this.#currentValue);
  }
}
