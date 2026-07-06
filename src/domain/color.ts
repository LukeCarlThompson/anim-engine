export type RgbaTuple = readonly [number, number, number, number];

export type LerpRgba = (from: RgbaTuple, to: RgbaTuple, progress: number) => RgbaTuple;
