export type DynamicValue = number | (() => number);

export const resolveValue = (value: DynamicValue): number =>
  typeof value === "function" ? value() : value;
