export type TweenState = {
  progressFraction: number;
  durationMs: number;
  easeFunction: (progress: number) => number;
};
