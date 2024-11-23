import type { AnimEngineSequenceApi, AnimEngineSequenceOptions } from "./anim-engine";

import { AnimSequence } from "./implementation";

export const createSequence = (options: AnimEngineSequenceOptions): AnimEngineSequenceApi => {
  return new AnimSequence(options);
};
