/**
 * Shared types and small helpers for the card-crop feature.
 * Everything here is browser-only at call time, but the module itself is safe
 * to import on the server (nothing touches `window` / `document` at load).
 */

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CardCropErrorCode =
  | "INVALID_FILE"
  | "UNSUPPORTED_FORMAT"
  | "FILE_TOO_LARGE"
  | "CORRUPT_PDF"
  | "PASSWORD_REQUIRED"
  | "WRONG_PASSWORD"
  | "UNEXPECTED_PAGES"
  | "DETECTION_FAILED"
  | "EMPTY_CANVAS"
  | "PROCESSING_FAILED";

/** Error type with a machine-readable code so the UI can react differently. */
export class CardCropError extends Error {
  readonly code: CardCropErrorCode;

  constructor(code: CardCropErrorCode, message: string) {
    super(message);
    this.name = "CardCropError";
    this.code = code;
  }
}

export function toCardCropError(error: unknown): CardCropError {
  if (error instanceof CardCropError) return error;
  const message = error instanceof Error ? error.message : "Unknown error";
  return new CardCropError(
    "PROCESSING_FAILED",
    `Processing failed: ${message}`,
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampRect(rect: Rect, bounds: Size): Rect {
  const x = clamp(rect.x, 0, bounds.width);
  const y = clamp(rect.y, 0, bounds.height);
  const right = clamp(rect.x + rect.width, 0, bounds.width);
  const bottom = clamp(rect.y + rect.height, 0, bounds.height);
  return {
    x,
    y,
    width: Math.max(0, right - x),
    height: Math.max(0, bottom - y),
  };
}

export function scaleRect(rect: Rect, factor: number): Rect {
  return {
    x: rect.x * factor,
    y: rect.y * factor,
    width: rect.width * factor,
    height: rect.height * factor,
  };
}

export function rectArea(rect: Rect): number {
  return rect.width * rect.height;
}

export function rectCenter(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/** Creates a canvas. Throws if the size is unusable. */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  if (!Number.isFinite(w) || !Number.isFinite(h)) {
    throw new CardCropError("EMPTY_CANVAS", "Invalid canvas size.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

export function get2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new CardCropError(
      "PROCESSING_FAILED",
      "Your browser could not create a drawing surface. Try a smaller DPI or another browser.",
    );
  }
  return ctx;
}

export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const copy = createCanvas(source.width, source.height);
  get2d(copy).drawImage(source, 0, 0);
  return copy;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png",
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else
          reject(
            new CardCropError(
              "PROCESSING_FAILED",
              "The browser could not encode the image (it may be too large). Try 300 DPI.",
            ),
          );
      },
      type,
      quality,
    );
  });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser time to start the download before releasing the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

let uidCounter = 0;
export function uid(prefix = "id"): string {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${uidCounter}`;
}

export type SniffedKind = "pdf" | "jpeg" | "png";

/**
 * Looks at the first bytes of the file instead of trusting the extension or
 * MIME type, so renamed .exe/.php/.zip files are rejected.
 */
export async function sniffFileKind(file: File): Promise<SniffedKind | null> {
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  if (
    head.length >= 3 &&
    head[0] === 0xff &&
    head[1] === 0xd8 &&
    head[2] === 0xff
  ) {
    return "jpeg";
  }
  if (
    head.length >= 8 &&
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47
  ) {
    return "png";
  }
  // "%PDF-" may be preceded by a few junk bytes; the spec allows it within 1024 bytes.
  const text = String.fromCharCode(...head);
  if (text.includes("%PDF-")) return "pdf";
  return null;
}

export function fileBaseName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return (
    base.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "card"
  );
}
