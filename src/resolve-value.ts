import type { DynamicValue } from "./shared-types";

export const resolveValue = (value: DynamicValue): number =>
  typeof value === "function" ? value() : value;
