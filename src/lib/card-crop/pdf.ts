import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import {
  CardCropError,
  clamp,
  clampRect,
  createCanvas,
  get2d,
  sniffFileKind,
  toCardCropError,
  uid,
} from "./utils";
import type { Rect, SniffedKind } from "./utils";
import { INDIVIDUAL_JPG_DPI, fitToPvc, getPvcPixelSize } from "./resize";

/**
 * A single page (or a single image) that can be shown, analysed and cropped.
 *
 * Coordinates: `rect` values passed to `renderRegion` are in *page units*
 * (PDF points for PDFs, original pixels for images). The `preview` canvas is
 * `previewScale` pixels per page unit, and is what detection/manual-crop use.
 * The final crop is re-rendered from the original vector/pixel data, so the
 * exported card is sharp and not an upscaled screenshot.
 */
export interface PageSource {
  id: string;
  index: number;
  kind: "pdf" | "image";
  width: number;
  height: number;
  previewScale: number;
  preview: HTMLCanvasElement;
  renderRegion(rect: Rect, targetWidthPx: number): Promise<HTMLCanvasElement>;
}

export interface LoadedDocument {
  kind: "pdf" | "image";
  /** Total number of pages in the file (may exceed `pages.length`). */
  pageCount: number;
  pages: PageSource[];
  dispose(): void;
}

export interface LoadOptions {
  maxBytes: number;
  accept: readonly SniffedKind[];
  /** Minimum number of pages a PDF must have. */
  minPages?: number;
  /** How many pages to render as previews. */
  maxPages?: number;
  password?: string;
}

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfJsPromise: Promise<PdfJsModule> | null = null;

/**
 * Loads pdf.js lazily so it is never evaluated on the server.
 * The "legacy" build is used on purpose: it polyfills newer JS features
 * (e.g. Promise.try) so PDFs also work on older Android/iOS browsers.
 */
async function getPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs")
      .then((mod) => {
        if (typeof window !== "undefined") {
          mod.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
            import.meta.url,
          ).toString();
        }
        return mod;
      })
      .catch((error: unknown) => {
        pdfJsPromise = null;
        throw error;
      });
  }
  return pdfJsPromise;
}

const MAX_REGION_HEIGHT_PX = 8000;

/**
 * Where pdf.js finds its standard fonts, CMaps, ICC profiles and wasm decoders.
 * `scripts/copy-pdfjs-assets.mjs` copies them into `public/pdfjs/`. Without them
 * PDFs still render, but PDFs that rely on non-embedded fonts may look different.
 */
let pdfAssetBase = "/pdfjs/";

export function setPdfAssetBase(base: string): void {
  pdfAssetBase = base.endsWith("/") ? base : `${base}/`;
}

function previewScaleFor(width: number, height: number): number {
  const longSide = Math.max(width, height);
  return clamp(2000 / longSide, 1.5, 4);
}

function formatLimit(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                  */
/* ------------------------------------------------------------------ */

export async function loadSourceFile(file: File, options: LoadOptions): Promise<LoadedDocument> {
  if (file.size === 0) {
    throw new CardCropError("INVALID_FILE", "The selected file is empty.");
  }
  if (file.size > options.maxBytes) {
    throw new CardCropError(
      "FILE_TOO_LARGE",
      `File is too large. Maximum allowed size is ${formatLimit(options.maxBytes)}.`,
    );
  }

  const kind = await sniffFileKind(file);
  if (!kind) {
    throw new CardCropError(
      "INVALID_FILE",
      "This is not a genuine PDF, JPG or PNG file. Only real PDF/image files are accepted.",
    );
  }
  if (!options.accept.includes(kind)) {
    const allowed = options.accept.map((k) => (k === "jpeg" ? "JPG" : k.toUpperCase())).join(" / ");
    throw new CardCropError("UNSUPPORTED_FORMAT", `This tool only accepts ${allowed} files.`);
  }

  try {
    return kind === "pdf" ? await loadPdf(file, options) : await loadImage(file);
  } catch (error) {
    throw toCardCropError(error);
  }
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

interface PdfErrorLike {
  name?: string;
  code?: number;
  message?: string;
}

async function loadPdf(file: File, options: LoadOptions): Promise<LoadedDocument> {
  const pdfjs = await getPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());

  const task = pdfjs.getDocument({
    data,
    password: options.password,
    standardFontDataUrl: `${pdfAssetBase}standard_fonts/`,
    cMapUrl: `${pdfAssetBase}cmaps/`,
    cMapPacked: true,
    iccUrl: `${pdfAssetBase}iccs/`,
    wasmUrl: `${pdfAssetBase}wasm/`,
  });
  let pdf: PDFDocumentProxy;
  try {
    pdf = await task.promise;
  } catch (raw) {
    const error = raw as PdfErrorLike;
    if (error?.name === "PasswordException") {
      // pdf.js: code 1 = password needed, code 2 = password incorrect.
      if (error.code === 2) {
        throw new CardCropError("WRONG_PASSWORD", "Incorrect PDF password. Please try again.");
      }
      throw new CardCropError("PASSWORD_REQUIRED", "This PDF is password protected.");
    }
    throw new CardCropError(
      "CORRUPT_PDF",
      "This PDF could not be read. The file may be corrupted or not a valid PDF.",
    );
  }

  const minPages = options.minPages ?? 1;
  if (pdf.numPages < minPages) {
    await task.destroy();
    throw new CardCropError(
      "UNEXPECTED_PAGES",
      `This PDF has ${pdf.numPages} page(s) but this tool needs ${minPages}.`,
    );
  }

  const pagesToRender = Math.min(pdf.numPages, options.maxPages ?? 1);
  const queue = createRenderQueue();
  const pages: PageSource[] = [];

  try {
    for (let i = 1; i <= pagesToRender; i += 1) {
      const page = await pdf.getPage(i);
      pages.push(await createPdfPageSource(page, i - 1, queue));
    }
  } catch (error) {
    await task.destroy();
    throw error;
  }

  return {
    kind: "pdf",
    pageCount: pdf.numPages,
    pages,
    dispose: () => {
      void task.destroy();
    },
  };
}

/** pdf.js renders one canvas at a time per document; keep our calls in order. */
function createRenderQueue(): <T>(job: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(job: () => Promise<T>): Promise<T> => {
    const run = tail.then(job, job);
    tail = run.catch(() => undefined);
    return run;
  };
}

async function createPdfPageSource(
  page: PDFPageProxy,
  index: number,
  enqueue: <T>(job: () => Promise<T>) => Promise<T>,
): Promise<PageSource> {
  const base = page.getViewport({ scale: 1 });
  if (!(base.width > 0) || !(base.height > 0)) {
    throw new CardCropError("EMPTY_CANVAS", "The PDF page is empty.");
  }

  const previewScale = previewScaleFor(base.width, base.height);
  const preview = await enqueue(() => renderPdfRegion(page, { x: 0, y: 0, width: base.width, height: base.height }, base.width * previewScale));

  return {
    id: uid("page"),
    index,
    kind: "pdf",
    width: base.width,
    height: base.height,
    previewScale,
    preview,
    renderRegion: (rect, targetWidthPx) => {
      const safe = clampRect(rect, { width: base.width, height: base.height });
      if (safe.width < 1 || safe.height < 1) {
        return Promise.reject(new CardCropError("EMPTY_CANVAS", "The crop area is empty."));
      }
      return enqueue(() => renderPdfRegion(page, safe, targetWidthPx));
    },
  };
}

/** Renders `rect` (PDF points) into a canvas that is `targetWidthPx` wide. */
async function renderPdfRegion(
  page: PDFPageProxy,
  rect: Rect,
  targetWidthPx: number,
): Promise<HTMLCanvasElement> {
  let scale = targetWidthPx / rect.width;
  const height = rect.height * scale;
  if (height > MAX_REGION_HEIGHT_PX) scale *= MAX_REGION_HEIGHT_PX / height;

  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(rect.width * scale), Math.ceil(rect.height * scale));
  const ctx = get2d(canvas);

  await page.render({
    canvas,
    canvasContext: ctx,
    viewport,
    // Shift the page so that `rect` lands at the canvas origin.
    transform: [1, 0, 0, 1, -rect.x * scale, -rect.y * scale],
    background: "#ffffff",
  }).promise;

  return canvas;
}

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  close(): void;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // fall through to <img>
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => undefined,
    };
  } catch {
    throw new CardCropError("INVALID_FILE", "This image could not be opened. It may be corrupted.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadImage(file: File): Promise<LoadedDocument> {
  const image = await decodeImage(file);
  if (image.width < 2 || image.height < 2) {
    image.close();
    throw new CardCropError("EMPTY_CANVAS", "The image is empty.");
  }

  const previewScale = Math.min(1, 2400 / Math.max(image.width, image.height));
  const preview = createCanvas(image.width * previewScale, image.height * previewScale);
  const pctx = get2d(preview);
  pctx.imageSmoothingQuality = "high";
  pctx.fillStyle = "#ffffff";
  pctx.fillRect(0, 0, preview.width, preview.height);
  pctx.drawImage(image.source, 0, 0, preview.width, preview.height);

  const page: PageSource = {
    id: uid("page"),
    index: 0,
    kind: "image",
    width: image.width,
    height: image.height,
    previewScale,
    preview,
    renderRegion: async (rect, targetWidthPx) => {
      const safe = clampRect(rect, { width: image.width, height: image.height });
      if (safe.width < 1 || safe.height < 1) {
        throw new CardCropError("EMPTY_CANVAS", "The crop area is empty.");
      }
      const canvas = createCanvas(
        targetWidthPx,
        Math.min(MAX_REGION_HEIGHT_PX, (targetWidthPx * safe.height) / safe.width),
      );
      const ctx = get2d(canvas);
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image.source,
        safe.x,
        safe.y,
        safe.width,
        safe.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      return canvas;
    },
  };

  return { kind: "image", pageCount: 1, pages: [page], dispose: () => image.close() };
}

/* ------------------------------------------------------------------ */
/* Crop -> PVC card                                                    */
/* ------------------------------------------------------------------ */

/**
 * Re-renders `rect` of the page directly at 600 DPI (from the original PDF
 * vectors / image pixels, not from the preview) and fits it to exactly
 * 2022 x 1275 px. The result is the un-adjusted "base" of a card.
 */
export async function renderCardBase(page: PageSource, rect: Rect): Promise<HTMLCanvasElement> {
  const target = getPvcPixelSize(INDIVIDUAL_JPG_DPI);
  const region = await page.renderRegion(rect, target.width);
  return fitToPvc(region, INDIVIDUAL_JPG_DPI);
}
