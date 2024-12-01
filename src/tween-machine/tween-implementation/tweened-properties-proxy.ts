import type { TweenedProperty } from "./tweened-property";

export class TweenedPropertiesProxy<Target> {
  readonly #from: Target;
  readonly #currentValue: Target;
  readonly #to: Target;
  readonly #currentVelocity: Target;

  public constructor(tweens: TweenedProperty<keyof Target>[]) {
    this.#from = {} as Target;
    this.#currentValue = {} as Target;
    this.#to = {} as Target;
    this.#currentVelocity = {} as Target;

    tweens.forEach((tween) => {
      Object.defineProperty(this.#from, tween.key, {
        get() {
          return tween.from;
        },
      });

      Object.defineProperty(this.#currentValue, tween.key, {
        get() {
          return tween.value;
        },
      });

      Object.defineProperty(this.#to, tween.key, {
        get() {
          return tween.to;
        },
      });

      Object.defineProperty(this.#currentVelocity, tween.key, {
        get() {
          return tween.velocity;
        },
      });
    });
  }

  public get from(): Target {
    return this.#from;
  }

  public get currentValue(): Target {
    return this.#currentValue;
  }

  public get to(): Target {
    return this.#to;
  }

  public get currentVelocity(): Target {
    return this.#currentVelocity;
  }
}
