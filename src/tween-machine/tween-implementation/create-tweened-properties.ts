import type { TweenedProperty } from "./tweened-property";

const isNumber = (value: unknown): value is number => typeof value === "number";

export const createTweenedProperties = <Target extends Record<string | symbol | number, unknown>>(
  target: Target,
  to: Target
): TweenedProperty<keyof typeof to>[] => {
  return Object.keys(to).map((key) => {
    const fromValue = target[key];
    const toValue = to[key];

    if (!isNumber(fromValue) || !isNumber(toValue)) {
      throw new Error("Target properties must be numbers");
    }

    return {
      key,
      from: fromValue,
      to: toValue,
      value: fromValue,
      velocity: 0,
    };
  });
};
