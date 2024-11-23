import type { AnimEngineApi, AnimEngineOptions, AnimEngineStatus, EaseName, NumberOrFunction } from "../anim-engine";
import { getInternalTicker } from "../get-ticker";
import { easingFunctions } from "./easing";
import type { Ticker } from "./ticker";

export type AnimEngineInternalApi = AnimEngineApi & {
  get duration(): number;
  get progress(): number;
  readonly update: (delta: number) => void;
};

export class AnimEngine implements AnimEngineInternalApi {
  #ticker: Ticker;
  #timeProgressFraction = 0;
  #status: AnimEngineStatus = "stopped";
  #to: NumberOrFunction;
  #toCurrentValue: number = 0;
  #from: NumberOrFunction;
  #fromCurrentValue: number = 0;
  #currentValue: number = 0;
  #velocity: number = 0;
  #durationMs: number;
  #easeName: EaseName;
  #repeatNumber: number;
  #onStarted?: (startValue: number) => void;
  #onUpdate?: (currentValue: number, velocity: number) => void;
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
  }: AnimEngineOptions) {
    this.#ticker = getInternalTicker();
    this.#to = to;
    this.#from = from;
    this.#durationMs = durationMs;
    this.#easeName = ease;
    this.#repeatNumber = repeat;
    this.#onStarted = onStarted;
    this.#onUpdate = onUpdate;
    this.#onEnded = onEnded;
    this.#onRepeat = onRepeat;
    this.#activate = () => {
      this.#ticker.activateAnimEngine(this);
    };
    this.#deactivate = () => {
      this.#ticker.deactivateAnimEngine(this);
    };
    this.#removeFromTicker = () => {
      this.#ticker.removeAnimEngine(this);
    };
  }

  public play(): Promise<AnimEngineApi> {
    this.#fromCurrentValue = this.#getConcreteValue(this.#from);
    this.#currentValue = this.#fromCurrentValue;
    this.#toCurrentValue = this.#getConcreteValue(this.#to);
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

  public set from(from: NumberOrFunction) {
    this.#from = from;
  }

  public set to(to: NumberOrFunction) {
    if (this.#status === "playing") {
      this.#timeProgressFraction = 0;
    }
    this.#to = to;
  }

  public set ease(ease: EaseName) {
    this.#easeName = ease;
  }

  public get progress(): number {
    return this.#timeProgressFraction;
  }

  public set progress(progress: number) {
    this.#timeProgressFraction = progress;
  }

  public get velocity(): number {
    return this.#velocity;
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

    const previousValue = this.#currentValue;

    // If we are over 1 progress then finish
    if (this.#timeProgressFraction >= 1) {
      this.#currentValue = this.#toCurrentValue;

      if (this.#repeatNumber < this.#repeatCounter) {
        this.#velocity = this.#currentValue - previousValue;
        this.#repeatCounter++;
        this.#onUpdate?.(this.#currentValue, this.#velocity);
        this.#repeat();
        return;
      }

      this.#velocity = 0;
      this.#onUpdate?.(this.#currentValue, this.#velocity);
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

    this.#velocity = this.#currentValue - previousValue;
    this.#onUpdate?.(this.#currentValue, this.#velocity);
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

  #getConcreteValue(numberOrFunction: NumberOrFunction): number {
    if (typeof numberOrFunction === "function") {
      return numberOrFunction();
    }

    return numberOrFunction;
  }
}
