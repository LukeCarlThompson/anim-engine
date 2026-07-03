// === Oklab color interpolation ===
//
// Normalized RGBA tuples [R, G, B, A] in → normalized RGBA tuples out.
// Perceptually uniform Oklab interpolation on RGB channels,
// linear interpolation on alpha.
//
// Matrices and formulas from Björn Ottosson (2020):
// https://bottosson.github.io/posts/oklab/

export type RgbaTuple = readonly [number, number, number, number];

/**
 * Pre-computed constants for Oklab conversion.
 *
 * sRGB → linear → LMS → LMS' (cube root) → Oklab
 */
const rgbToLmsMatrix = [
  // L
  0.4122214708, 0.5363325363, 0.0514459929,
  // M
  0.2119034982, 0.6806995451, 0.1073969566,
  // S
  0.0883024619, 0.2817188376, 0.6299787005,
] as const;

const lmsPrimeToLabMatrix = [
  // L
  0.2104542553, 0.7936177850, -0.0040720468,
  // a
  1.9779984951, -2.4285922050, 0.4505937099,
  // b
  0.0259040371, 0.7827717662, -0.8086757660,
] as const;

const labToLmsPrimeMatrix = [
  1.0, 0.3963377922, 0.2158037583,
  1.0, -0.1055613423, -0.0638541728,
  1.0, -0.0894841825, -1.2914855377,
] as const;

const lmsToLinearRgbMatrix = [
  // R
  4.0767416621, -3.3077115913, 0.2309699292,
  // G
  -1.2684380046, 2.6097574011, -0.3413193965,
  // B
  -0.0041960863, -0.7034186147, 1.7076147010,
] as const;

/**
 * Convert a normalized sRGB channel to linear.
 */
const srgbToLinear = (channel: number): number => {
  if (channel <= 0.04045) {
    return channel / 12.92;
  }
  return ((channel + 0.055) / 1.055) ** 2.4;
};

/**
 * Convert a linear channel to sRGB.
 */
const linearToSrgb = (channel: number): number => {
  if (channel <= 0.0031308) {
    return channel * 12.92;
  }
  return 1.055 * channel ** (1 / 2.4) - 0.055;
};

/**
 * Convert an RGB tuple to Oklab [L, a, b].
 * All values in [0, 1] range (except a/b which can be negative).
 */
const rgbToOklab = (
  r: number,
  g: number,
  b: number,
): [number, number, number] => {
  // Linearize sRGB
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  // Linear RGB → LMS
  const lLms =
    rgbToLmsMatrix[0] * rLin + rgbToLmsMatrix[1] * gLin + rgbToLmsMatrix[2] * bLin;
  const mLms =
    rgbToLmsMatrix[3] * rLin + rgbToLmsMatrix[4] * gLin + rgbToLmsMatrix[5] * bLin;
  const sLms =
    rgbToLmsMatrix[6] * rLin + rgbToLmsMatrix[7] * gLin + rgbToLmsMatrix[8] * bLin;

  // LMS → LMS' (cube root)
  const lPrime = Math.cbrt(lLms);
  const mPrime = Math.cbrt(mLms);
  const sPrime = Math.cbrt(sLms);

  // LMS' → Oklab
  const L =
    lmsPrimeToLabMatrix[0] * lPrime +
    lmsPrimeToLabMatrix[1] * mPrime +
    lmsPrimeToLabMatrix[2] * sPrime;
  const aL =
    lmsPrimeToLabMatrix[3] * lPrime +
    lmsPrimeToLabMatrix[4] * mPrime +
    lmsPrimeToLabMatrix[5] * sPrime;
  const bL =
    lmsPrimeToLabMatrix[6] * lPrime +
    lmsPrimeToLabMatrix[7] * mPrime +
    lmsPrimeToLabMatrix[8] * sPrime;

  return [L, aL, bL];
};

/**
 * Convert an Oklab [L, a, b] tuple back to sRGB [R, G, B].
 * All values clamped to [0, 1].
 */
const oklabToRgb = (L: number, aL: number, bL: number): [number, number, number] => {
  // Oklab → LMS'
  const lPrime =
    labToLmsPrimeMatrix[0] * L +
    labToLmsPrimeMatrix[1] * aL +
    labToLmsPrimeMatrix[2] * bL;
  const mPrime =
    labToLmsPrimeMatrix[3] * L +
    labToLmsPrimeMatrix[4] * aL +
    labToLmsPrimeMatrix[5] * bL;
  const sPrime =
    labToLmsPrimeMatrix[6] * L +
    labToLmsPrimeMatrix[7] * aL +
    labToLmsPrimeMatrix[8] * bL;

  // LMS' → LMS (cube)
  const lLms = lPrime * lPrime * lPrime;
  const mLms = mPrime * mPrime * mPrime;
  const sLms = sPrime * sPrime * sPrime;

  // LMS → Linear RGB
  const rLin =
    lmsToLinearRgbMatrix[0] * lLms +
    lmsToLinearRgbMatrix[1] * mLms +
    lmsToLinearRgbMatrix[2] * sLms;
  const gLin =
    lmsToLinearRgbMatrix[3] * lLms +
    lmsToLinearRgbMatrix[4] * mLms +
    lmsToLinearRgbMatrix[5] * sLms;
  const bLin =
    lmsToLinearRgbMatrix[6] * lLms +
    lmsToLinearRgbMatrix[7] * mLms +
    lmsToLinearRgbMatrix[8] * sLms;

  // Linear RGB → sRGB (clamped to [0, 1])
  const r = clamp(linearToSrgb(rLin));
  const g = clamp(linearToSrgb(gLin));
  const b = clamp(linearToSrgb(bLin));

  return [r, g, b];
};

/**
 * Clamp a value to [0, 1].
 */
const clamp = (value: number): number => {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

/**
 * Interpolate between two RGBA colors in Oklab space.
 *
 * The RGB channels are converted to Oklab, lerped perceptually uniformly,
 * and converted back. The alpha channel is lerped linearly.
 *
 * @param from - Starting RGBA tuple [R, G, B, A], each 0–1.
 * @param to - Ending RGBA tuple [R, G, B, A], each 0–1.
 * @param progress - Interpolation factor (0 = from, 1 = to).
 * @returns A new RGBA tuple [R, G, B, A], each 0–1.
 */
export const lerpOklab = (
  from: RgbaTuple,
  to: RgbaTuple,
  progress: number,
): [number, number, number, number] => {
  const clampedProgress = clamp(progress);

  // Convert RGB channels to Oklab
  const [lFrom, aFrom, bFrom] = rgbToOklab(from[0], from[1], from[2]);
  const [lTo, aTo, bTo] = rgbToOklab(to[0], to[1], to[2]);

  // Lerp in Oklab space
  const lLerped = lFrom + (lTo - lFrom) * clampedProgress;
  const aLerped = aFrom + (aTo - aFrom) * clampedProgress;
  const bLerped = bFrom + (bTo - bFrom) * clampedProgress;

  // Convert back to RGB
  const [r, g, b] = oklabToRgb(lLerped, aLerped, bLerped);

  // Lerp alpha linearly
  const alpha = clamp(from[3] + (to[3] - from[3]) * clampedProgress);

  return [r, g, b, alpha];
};

/**
 * Parse a hex color string into an RGBA tuple.
 *
 * Accepts formats:
 *   - `#RGB`
 *   - `#RGBA`
 *   - `#RRGGBB`
 *   - `#RRGGBBAA`
 *
 * @param hex - Hex color string with optional leading `#`.
 * @returns An RGBA tuple [R, G, B, A], each 0–1.
 */
export const hexToRgba = (hex: string): [number, number, number, number] => {
  // Strip leading #
  const cleaned = hex.startsWith("#") ? hex.slice(1) : hex;

  // Validate — only hex characters allowed
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    return [0, 0, 0, 1];
  }

  if (cleaned.length === 3) {
    // #RGB → #RRGGBB
    const r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    const g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    const b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
    return [r, g, b, 1];
  }

  if (cleaned.length === 4) {
    // #RGBA → #RRGGBBAA
    const r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    const g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    const b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
    const a = parseInt(cleaned[3] + cleaned[3], 16) / 255;
    return [r, g, b, a];
  }

  if (cleaned.length >= 6) {
    const r = parseInt(cleaned.slice(0, 2), 16) / 255;
    const g = parseInt(cleaned.slice(2, 4), 16) / 255;
    const b = parseInt(cleaned.slice(4, 6), 16) / 255;
    const a = cleaned.length >= 8 ? parseInt(cleaned.slice(6, 8), 16) / 255 : 1;
    return [r, g, b, a];
  }

  // Invalid — return opaque black
  return [0, 0, 0, 1];
};
