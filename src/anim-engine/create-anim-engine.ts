import type { AnimEngineApi, AnimEngineOptions } from "./anim-engine";

import { AnimEngine } from "./implementation";

export const createAnimEngine = (options: AnimEngineOptions): AnimEngineApi => {
  return new AnimEngine(options);
};
