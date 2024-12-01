import type { Tween, TweenTarget } from "../tween-machine";

import type { Ticker } from "../../anim-engine/ticker-implementation";
import type { TweenOptions } from "../tween-machine";
import { TweenedPropertiesProxy } from "./tweened-properties-proxy";
import type { TweenedProperty } from "./tweened-property";
import { createTweenedProperties } from "./create-tweened-properties";
import { easingFunctions } from "./easing-functions";
import { getTicker } from "../get-ticker";
import { updateTweenState } from "./update-tween-state";
import { updateTweenedProperty } from "./update-tweened-property";

const ticker = getTicker() as Ticker;

export type TweenImplementationProps<Target extends TweenTarget> = {
  target: Target;
} & TweenOptions<Target>;

export class TweenImplementation<Target extends TweenTarget> implements Tween {
  #target: Target;
  #tweenedPropertiesProxy: TweenedPropertiesProxy<Target>;
  #tweenedProperties: TweenedProperty<keyof Target>[];
  #onStarted?: (startValue: Target) => void;
  #onUpdate?: (currentValue: Target, velocity: Target) => void;
  #onEnded?: (endValue: Target) => void;
  #playController?: AbortController;
  #tweenState: {
    progressFraction: number;
    durationMs: number;
    easeFunction: (progress: number) => number;
  };

  public constructor({
    target,
    to,
    durationMs = 1000,
    ease = "inOutSine",
    onStarted,
    onEnded,
    onUpdate,
  }: TweenImplementationProps<Target>) {
    this.#target = target;

    this.#tweenState = {
      durationMs,
      easeFunction: easingFunctions[ease],
      progressFraction: 0,
    };

    this.#tweenedProperties = createTweenedProperties(target, to);

    this.#tweenedPropertiesProxy = new TweenedPropertiesProxy(this.#tweenedProperties);

    this.#onStarted = onStarted;
    this.#onUpdate = onUpdate;
    this.#onEnded = onEnded;
  }

  public play(): Promise<void> {
    this.#tweenState.progressFraction = 0;
    const promise = new Promise<void>((resolve) => {
      this.#playController = new AbortController();
      this.#playController.signal.addEventListener("abort", () => {
        ticker.deactivateAnimEngine(this);
        resolve();
      });
    });

    this.#onStarted?.(this.#tweenedPropertiesProxy.from);
    ticker.activateAnimEngine(this);

    return promise;
  }

  public update(deltaMs: number): void {
    updateTweenState(deltaMs, this.#tweenState);

    this.#tweenedProperties.forEach((property) => {
      updateTweenedProperty(this.#tweenState, property);
      // TODO: Can I avoid typecasting?
      (this.#target[property.key] as number) = property.value;
    });

    this.#onUpdate?.(this.#tweenedPropertiesProxy.currentValue, this.#tweenedPropertiesProxy.currentVelocity);

    if (this.#tweenState.progressFraction === 1) {
      this.#playController?.abort();
      this.#onEnded?.(this.#tweenedPropertiesProxy.currentValue);
    }
  }

  public pause(): void {
    ticker.deactivateAnimEngine(this);
  }

  public resume(): void {
    ticker.activateAnimEngine(this);
  }

  public stop(): void {
    this.#playController?.abort();
  }

  public skipToEnd(): void {
    this.#tweenState.progressFraction = 1;
  }

  public kill(): void {
    ticker.removeAnimEngine(this);
  }
}
