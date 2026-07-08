/**
 * Represents a value that can either be a static number or a function
 * that returns a number. Functions are re-evaluated each time the value
 * is resolved, allowing dynamic values that change over time.
 */
export type DynamicValue = number | (() => number);

/**
 * Resolves a {@link DynamicValue} to a concrete number.
 * If the value is a function, it is called and its return value is used.
 * If the value is a number, it is returned directly.
 *
 * @param value - The dynamic value to resolve.
 * @returns The resolved number.
 */
export const resolveValue = (value: DynamicValue): number =>
  typeof value === "function" ? value() : value;
