import type { AnimEngineApi, AnimEngineOptions } from "./anim-engine";

import { AnimEngine } from "./implementation";
import type { AnimEngineInternalApi } from "./implementation/anim-engine";
import { getInternalTicker } from "./get-ticker";

export const createAnimEngine = (options: AnimEngineOptions): AnimEngineApi => {
  const ticker = getInternalTicker();

  if (ticker.autoStart) {
    ticker.start();
  }

  return new AnimEngine({
    ...options,
    activate: (animEngine: AnimEngineInternalApi) => {
      ticker.activateAnimEngine(animEngine);
    },
    deactivate: (animEngine: AnimEngineInternalApi) => {
      ticker.deactivateAnimEngine(animEngine);
    },
    removeFromTicker: (animEngine: AnimEngineInternalApi) => {
      ticker.removeAnimEngine(animEngine);
    },
  });
};
