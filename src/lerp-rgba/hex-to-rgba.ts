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
