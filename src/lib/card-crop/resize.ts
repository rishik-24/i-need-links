import { clamp, createCanvas, get2d } from "./utils";
import type { Point, Size } from "./utils";

/** Physical PVC (ISO/IEC 7810 ID-1) card size. */
export const PVC_WIDTH_MM = 85.6;
export const PVC_HEIGHT_MM = 53.98;
export const PVC_ASPECT = PVC_WIDTH_MM / PVC_HEIGHT_MM;

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/** 4 x 6 inch photo paper, portrait. */
export const PAGE_4X6_WIDTH_MM = 4 * 25.4;
export const PAGE_4X6_HEIGHT_MM = 6 * 25.4;

export type Dpi = 300 | 600;
export const DPI_OPTIONS: readonly Dpi[] = [300, 600];

/** Highest quality used for individual Front/Back JPG files. */
export const INDIVIDUAL_JPG_DPI: Dpi = 600;

export const MAX_A4_PAIRS = 5;

/** pixels = mm / 25.4 * DPI  (rounded to the nearest pixel) */
export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

export function pxToMm(px: number, dpi: number): number {
  return (px / dpi) * 25.4;
}

export function getPvcPixelSize(dpi: number): Size {
  return { width: mmToPx(PVC_WIDTH_MM, dpi), height: mmToPx(PVC_HEIGHT_MM, dpi) };
}

export function getA4PixelSize(dpi: number): Size {
  return { width: mmToPx(A4_WIDTH_MM, dpi), height: mmToPx(A4_HEIGHT_MM, dpi) };
}

export function get4x6PixelSize(dpi: number): Size {
  return { width: 4 * dpi, height: 6 * dpi };
}

/**
 * Sources whose aspect ratio is within this tolerance of the PVC ratio are
 * stretched (an imperceptible 6 % at most). Anything further off is letter-boxed
 * so that no content is cut off and nothing is visibly distorted.
 */
const STRETCH_TOLERANCE = 0.06;

export type FitMode = "stretch" | "contain";

export function chooseFitMode(sourceAspect: number): FitMode {
  return Math.abs(sourceAspect / PVC_ASPECT - 1) <= STRETCH_TOLERANCE ? "stretch" : "contain";
}

/**
 * Produces a canvas of exactly the PVC pixel size for the given DPI.
 * The source is never distorted noticeably: near-PVC sources are stretched,
 * others are centred on white ("contain").
 */
export function fitToPvc(source: HTMLCanvasElement, dpi: number): HTMLCanvasElement {
  const target = getPvcPixelSize(dpi);
  const out = createCanvas(target.width, target.height);
  const ctx = get2d(out);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);

  const aspect = source.width / source.height;
  if (chooseFitMode(aspect) === "stretch") {
    ctx.drawImage(source, 0, 0, out.width, out.height);
    return out;
  }

  const scale = Math.min(out.width / source.width, out.height / source.height);
  const w = source.width * scale;
  const h = source.height * scale;
  ctx.drawImage(source, (out.width - w) / 2, (out.height - h) / 2, w, h);
  return out;
}

/** Scales an already-PVC-shaped canvas to another DPI (exact PVC pixel size). */
export function rescalePvc(source: HTMLCanvasElement, dpi: number): HTMLCanvasElement {
  const target = getPvcPixelSize(dpi);
  if (source.width === target.width && source.height === target.height) return source;
  return fitToPvc(source, dpi);
}

/* ------------------------------------------------------------------ */
/* Sheet layout helpers (all positions are in millimetres, top-left).  */
/* ------------------------------------------------------------------ */

const A4_MARGIN_TOP_MM = 8;
const A4_ROW_GAP_MM = 3;
const A4_COLUMN_GAP_MM = 4;

export interface PairPositions {
  front: Point;
  back: Point | null;
}

/** Default "Front | Back" row for the n-th pair (0-based) on an A4 sheet. */
export function defaultA4PairPositions(index: number, hasBack: boolean): PairPositions {
  const rowWidth = PVC_WIDTH_MM * 2 + A4_COLUMN_GAP_MM;
  const left = (A4_WIDTH_MM - rowWidth) / 2;
  const y = A4_MARGIN_TOP_MM + index * (PVC_HEIGHT_MM + A4_ROW_GAP_MM);
  return {
    front: { x: left, y },
    back: hasBack ? { x: left + PVC_WIDTH_MM + A4_COLUMN_GAP_MM, y } : null,
  };
}

/** Keeps a card fully inside the sheet without ever changing its size. */
export function clampCardPosition(
  point: Point,
  pageWidthMm: number = A4_WIDTH_MM,
  pageHeightMm: number = A4_HEIGHT_MM,
): Point {
  return {
    x: clamp(point.x, 0, pageWidthMm - PVC_WIDTH_MM),
    y: clamp(point.y, 0, pageHeightMm - PVC_HEIGHT_MM),
  };
}

/** Centred stack of 1–2 cards on a 4x6 inch portrait page. */
export function layout4x6(count: number): Point[] {
  const gap = 8; // mm
  const total = count * PVC_HEIGHT_MM + (count - 1) * gap;
  const top = (PAGE_4X6_HEIGHT_MM - total) / 2;
  const left = (PAGE_4X6_WIDTH_MM - PVC_WIDTH_MM) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: left,
    y: top + i * (PVC_HEIGHT_MM + gap),
  }));
}
