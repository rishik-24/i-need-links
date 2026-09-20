import { applyAdjustments } from "./adjustments";
import type { Adjustments } from "./adjustments";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  INDIVIDUAL_JPG_DPI,
  PAGE_4X6_HEIGHT_MM,
  PAGE_4X6_WIDTH_MM,
  layout4x6,
  mmToPx,
  rescalePvc,
} from "./resize";
import type { Dpi } from "./resize";
import { canvasToBlob, createCanvas, delay, get2d, triggerDownload } from "./utils";

/**
 * A card ready to export: `base` is the un-adjusted PVC-sized canvas
 * (2022 x 1275 px = 600 DPI); adjustments are baked in at export time.
 */
export interface CardImage {
  base: HTMLCanvasElement;
  adjustments: Adjustments;
}

/** A card placed on a sheet. Position = top-left corner in millimetres. */
export interface SheetItem {
  image: CardImage;
  xMm: number;
  yMm: number;
}

const JPEG_QUALITY = 0.95;

/** Renders a card at the requested DPI (exact PVC pixel size) with adjustments applied. */
export function renderCardAtDpi(image: CardImage, dpi: number): HTMLCanvasElement {
  return applyAdjustments(rescalePvc(image.base, dpi), image.adjustments);
}

/* ------------------------------------------------------------------ */
/* JPEG encoding with a real DPI tag                                   */
/* ------------------------------------------------------------------ */

/** Writes the DPI into the JFIF header so printers/editors use the right physical size. */
function withJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  const hi = (dpi >> 8) & 0xff;
  const lo = dpi & 0xff;
  const isJfif =
    bytes.length > 18 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    bytes[6] === 0x4a && // J
    bytes[7] === 0x46 && // F
    bytes[8] === 0x49 && // I
    bytes[9] === 0x46; // F

  if (isJfif) {
    const copy = bytes.slice();
    copy[13] = 1; // units: dots per inch
    copy[14] = hi;
    copy[15] = lo;
    copy[16] = hi;
    copy[17] = lo;
    return copy;
  }

  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const app0 = [
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, hi, lo, hi, lo, 0x00,
    0x00,
  ];
  const out = new Uint8Array(bytes.length + app0.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}

export async function encodeJpeg(
  canvas: HTMLCanvasElement,
  dpi: number,
  quality: number = JPEG_QUALITY,
): Promise<Blob> {
  const blob = await canvasToBlob(canvas, "image/jpeg", quality);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const tagged = withJpegDpi(bytes, dpi);
  return new Blob([tagged.buffer as ArrayBuffer], { type: "image/jpeg" });
}

export async function downloadJpeg(
  canvas: HTMLCanvasElement,
  filename: string,
  dpi: number,
  quality: number = JPEG_QUALITY,
): Promise<void> {
  triggerDownload(await encodeJpeg(canvas, dpi, quality), filename);
}

/** Encoded size of a card JPG (for the "503.5 KB" label). */
export async function estimateCardJpegSize(image: CardImage): Promise<number> {
  const blob = await encodeJpeg(renderCardAtDpi(image, INDIVIDUAL_JPG_DPI), INDIVIDUAL_JPG_DPI);
  return blob.size;
}

/* ------------------------------------------------------------------ */
/* Individual card downloads                                           */
/* ------------------------------------------------------------------ */

export async function downloadFront(front: CardImage, baseName: string): Promise<void> {
  await downloadJpeg(
    renderCardAtDpi(front, INDIVIDUAL_JPG_DPI),
    `${baseName}-front.jpg`,
    INDIVIDUAL_JPG_DPI,
  );
}

export async function downloadBack(back: CardImage, baseName: string): Promise<void> {
  await downloadJpeg(
    renderCardAtDpi(back, INDIVIDUAL_JPG_DPI),
    `${baseName}-back.jpg`,
    INDIVIDUAL_JPG_DPI,
  );
}

/** Front then back, one after the other (browsers need a short gap between downloads). */
export async function downloadBoth(
  front: CardImage,
  back: CardImage | null,
  baseName: string,
): Promise<void> {
  await downloadFront(front, baseName);
  if (back) {
    await delay(500);
    await downloadBack(back, baseName);
  }
}

/* ------------------------------------------------------------------ */
/* Sheets: A4 and 4x6                                                  */
/* ------------------------------------------------------------------ */

function renderSheet(
  items: SheetItem[],
  pageWidthMm: number,
  pageHeightMm: number,
  dpi: Dpi,
): HTMLCanvasElement {
  const canvas = createCanvas(mmToPx(pageWidthMm, dpi), mmToPx(pageHeightMm, dpi));
  const ctx = get2d(canvas);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const item of items) {
    // Every card is rendered at the exact PVC pixel size for this DPI, so a card
    // keeps 85.60 x 53.98 mm wherever it is positioned.
    const card = renderCardAtDpi(item.image, dpi);
    ctx.drawImage(card, mmToPx(item.xMm, dpi), mmToPx(item.yMm, dpi));
  }
  return canvas;
}

export function renderA4(items: SheetItem[], dpi: Dpi): HTMLCanvasElement {
  return renderSheet(items, A4_WIDTH_MM, A4_HEIGHT_MM, dpi);
}

export function render4x6(images: CardImage[], dpi: Dpi): HTMLCanvasElement {
  const positions = layout4x6(images.length);
  const items = images.map((image, i) => ({ image, xMm: positions[i].x, yMm: positions[i].y }));
  return renderSheet(items, PAGE_4X6_WIDTH_MM, PAGE_4X6_HEIGHT_MM, dpi);
}

export async function downloadA4Jpeg(
  items: SheetItem[],
  dpi: Dpi,
  baseName: string,
): Promise<void> {
  await downloadJpeg(renderA4(items, dpi), `${baseName}-A4-${dpi}dpi.jpg`, dpi);
}

export async function downloadA4Pdf(
  items: SheetItem[],
  dpi: Dpi,
  baseName: string,
): Promise<void> {
  const blob = await encodeJpeg(renderA4(items, dpi), dpi);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  pdf.addImage(dataUrl, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
  triggerDownload(pdf.output("blob"), `${baseName}-A4-${dpi}dpi.pdf`);
}

export async function download4x6(
  images: CardImage[],
  dpi: Dpi,
  baseName: string,
): Promise<void> {
  await downloadJpeg(render4x6(images, dpi), `${baseName}-4x6-${dpi}dpi.jpg`, dpi);
}
