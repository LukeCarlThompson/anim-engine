/**
 * A tuple representing an RGBA color with each channel as a float in the range [0, 1].
 * Ordered as [red, green, blue, alpha].
 */
export type RgbaTuple = readonly [number, number, number, number];

/**
 * A function that linearly interpolates between two RGBA colors in Oklab color space.
 *
 * @param from - The starting color as an RgbaTuple.
 * @param to - The ending color as an RgbaTuple.
 * @param progress - A number between 0 and 1 representing the interpolation progress.
 * @returns The interpolated color as an RgbaTuple.
 */
export type LerpRgba = (from: RgbaTuple, to: RgbaTuple, progress: number) => RgbaTuple;
