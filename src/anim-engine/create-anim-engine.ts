import type { AnimEngineApi, AnimEngineOptions } from "./anim-engine";

import { AnimEngine } from "./implementation";

export const createAnimEngine = (options: AnimEngineOptions): AnimEngineApi => {
  // TODO: Support array of values.
  // If array values are passed in then just create multiple AnimEngine classes and return an object that controls all of them at once?

  return new AnimEngine(options);
};
