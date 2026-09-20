import { createCanvas, get2d } from "./utils";

/** Percent values; 100 means "unchanged" (matches the reference tool's sliders). */
export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
}

export type AdjustmentKey = keyof Adjustments;

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export const ADJUSTMENT_RANGES: Record<AdjustmentKey, { min: number; max: number }> = {
  brightness: { min: 50, max: 150 },
  contrast: { min: 50, max: 150 },
  saturation: { min: 0, max: 200 },
};

export const ADJUSTMENT_LABELS: Record<AdjustmentKey, string> = {
  brightness: "Brightness",
  contrast: "Contrast",
  saturation: "Saturation",
};

export function isNeutral(adjustments: Adjustments): boolean {
  return (
    adjustments.brightness === 100 &&
    adjustments.contrast === 100 &&
    adjustments.saturation === 100
  );
}

/**
 * Returns a NEW canvas with the adjustments baked into the pixels, so the
 * exported JPG matches the preview. When nothing changes, the source canvas
 * itself is returned (callers must treat the result as read-only).
 *
 *   brightness : value * b
 *   contrast   : (value - 128) * c + 128
 *   saturation : luma + (value - luma) * s      (Rec. 601 luma)
 */
export function applyAdjustments(
  source: HTMLCanvasElement,
  adjustments: Adjustments,
): HTMLCanvasElement {
  if (isNeutral(adjustments)) return source;

  const out = createCanvas(source.width, source.height);
  const ctx = get2d(out);
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, out.width, out.height);
  const data = image.data;

  const b = adjustments.brightness / 100;
  const c = adjustments.contrast / 100;
  const s = adjustments.saturation / 100;

  // Brightness + contrast only depend on the channel value: use a lookup table.
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v += 1) {
    lut[v] = (v * b - 128) * c + 128;
  }

  const applySaturation = s !== 1;
  for (let i = 0; i < data.length; i += 4) {
    const r = lut[data[i]];
    const g = lut[data[i + 1]];
    const bl = lut[data[i + 2]];
    if (applySaturation) {
      const luma = 0.299 * r + 0.587 * g + 0.114 * bl;
      data[i] = luma + (r - luma) * s;
      data[i + 1] = luma + (g - luma) * s;
      data[i + 2] = luma + (bl - luma) * s;
    } else {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = bl;
    }
  }

  ctx.putImageData(image, 0, 0);
  return out;
}
