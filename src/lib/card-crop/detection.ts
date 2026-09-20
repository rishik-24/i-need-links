import { PVC_ASPECT } from "./resize";
import { clamp, clampRect, createCanvas, get2d } from "./utils";
import type { Rect } from "./utils";
import type { PageSource } from "./pdf";

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

/** A crop rectangle on a specific page. `rect` is in page units (see PageSource). */
export interface Placement {
  pageIndex: number;
  rect: Rect;
}

export interface DetectedCards {
  front: Placement;
  back: Placement | null;
  /** Which algorithm produced the result (useful for debugging / messages). */
  method: string;
  /** 0..1, rough quality of the match. */
  confidence: number;
}

export type DetectionOutcome =
  | { ok: true; cards: DetectedCards }
  | { ok: false; reason: string };

export type DetectionStrategy = "ration" | "voter" | "pan" | "ayushman" | "abc";

export const DETECTION_FAILED_MESSAGE =
  "Automatic card detection could not identify the card. Please use Manual Crop.";

/* ------------------------------------------------------------------ */
/* Raster helpers                                                      */
/* ------------------------------------------------------------------ */

interface Raster {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  /** Raster pixels per page unit. */
  scale: number;
}

/** Inclusive pixel bounds. */
interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const boxWidth = (b: Box): number => b.x1 - b.x0 + 1;
const boxHeight = (b: Box): number => b.y1 - b.y0 + 1;
const boxArea = (b: Box): number => boxWidth(b) * boxHeight(b);

const MAX_ANALYSIS_WIDTH = 1600;

function rasterize(page: PageSource): Raster {
  const src = page.preview;
  let canvas = src;
  let factor = 1;
  if (src.width > MAX_ANALYSIS_WIDTH) {
    factor = MAX_ANALYSIS_WIDTH / src.width;
    canvas = createCanvas(src.width * factor, src.height * factor);
    const ctx = get2d(canvas);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  }
  const image = get2d(canvas).getImageData(0, 0, canvas.width, canvas.height);
  return {
    width: image.width,
    height: image.height,
    data: image.data,
    scale: page.previewScale * factor,
  };
}

/** Most common colour along the outer border of the page = page background. */
function estimateBackground(r: Raster): [number, number, number] {
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  const band = Math.max(2, Math.round(Math.min(r.width, r.height) * 0.01));
  const sample = (x: number, y: number): void => {
    const i = (y * r.width + x) * 4;
    hist[0][r.data[i]] += 1;
    hist[1][r.data[i + 1]] += 1;
    hist[2][r.data[i + 2]] += 1;
  };
  for (let y = 0; y < r.height; y += 2) {
    for (let x = 0; x < band; x += 1) {
      sample(x, y);
      sample(r.width - 1 - x, y);
    }
  }
  for (let x = 0; x < r.width; x += 2) {
    for (let y = 0; y < band; y += 1) {
      sample(x, y);
      sample(x, r.height - 1 - y);
    }
  }
  const mode = (h: Uint32Array): number => {
    let best = 0;
    for (let v = 1; v < 256; v += 1) if (h[v] > h[best]) best = v;
    return best;
  };
  return [mode(hist[0]), mode(hist[1]), mode(hist[2])];
}

const FOREGROUND_THRESHOLD = 32;

/** 1 where the pixel differs noticeably from the page background. */
function foregroundMask(r: Raster, bg: [number, number, number]): Uint8Array {
  const mask = new Uint8Array(r.width * r.height);
  const d = r.data;
  for (let p = 0, i = 0; p < mask.length; p += 1, i += 4) {
    const dr = Math.abs(d[i] - bg[0]);
    const dg = Math.abs(d[i + 1] - bg[1]);
    const db = Math.abs(d[i + 2] - bg[2]);
    if (dr > FOREGROUND_THRESHOLD || dg > FOREGROUND_THRESHOLD || db > FOREGROUND_THRESHOLD) {
      mask[p] = 1;
    }
  }
  return mask;
}

/** Separable box dilation (square structuring element of the given radius). */
function dilate(mask: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    let count = 0;
    for (let x = 0; x < Math.min(radius, w); x += 1) count += mask[row + x];
    for (let x = 0; x < w; x += 1) {
      const add = x + radius;
      if (add < w) count += mask[row + add];
      const remove = x - radius - 1;
      if (remove >= 0) count -= mask[row + remove];
      tmp[row + x] = count > 0 ? 1 : 0;
    }
  }
  const out = new Uint8Array(w * h);
  const counts = new Int32Array(w);
  for (let y = 0; y < Math.min(radius, h); y += 1) {
    for (let x = 0; x < w; x += 1) counts[x] += tmp[y * w + x];
  }
  for (let y = 0; y < h; y += 1) {
    const add = y + radius;
    if (add < h) for (let x = 0; x < w; x += 1) counts[x] += tmp[add * w + x];
    const remove = y - radius - 1;
    if (remove >= 0) for (let x = 0; x < w; x += 1) counts[x] -= tmp[remove * w + x];
    const row = y * w;
    for (let x = 0; x < w; x += 1) out[row + x] = counts[x] > 0 ? 1 : 0;
  }
  return out;
}

/** 4-connected component labelling. Labels start at 1. */
function labelComponents(
  mask: Uint8Array,
  w: number,
  h: number,
): { labels: Int32Array; count: number } {
  const labels = new Int32Array(w * h);
  const stack = new Int32Array(w * h);
  let count = 0;
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || labels[start]) continue;
    count += 1;
    let sp = 0;
    stack[sp++] = start;
    labels[start] = count;
    while (sp > 0) {
      const p = stack[--sp];
      const x = p % w;
      if (x > 0 && mask[p - 1] && !labels[p - 1]) {
        labels[p - 1] = count;
        stack[sp++] = p - 1;
      }
      if (x < w - 1 && mask[p + 1] && !labels[p + 1]) {
        labels[p + 1] = count;
        stack[sp++] = p + 1;
      }
      if (p >= w && mask[p - w] && !labels[p - w]) {
        labels[p - w] = count;
        stack[sp++] = p - w;
      }
      if (p < mask.length - w && mask[p + w] && !labels[p + w]) {
        labels[p + w] = count;
        stack[sp++] = p + w;
      }
    }
  }
  return { labels, count };
}

/** Tight bounding box (over the *original* mask) of every labelled component. */
function componentBoxes(
  fg: Uint8Array,
  labels: Int32Array,
  count: number,
  w: number,
): Array<{ box: Box; pixels: number }> {
  const boxes = Array.from({ length: count + 1 }, () => ({
    box: { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity } as Box,
    pixels: 0,
  }));
  for (let p = 0; p < fg.length; p += 1) {
    if (!fg[p]) continue;
    const label = labels[p];
    if (!label) continue;
    const x = p % w;
    const y = (p - x) / w;
    const c = boxes[label];
    if (x < c.box.x0) c.box.x0 = x;
    if (x > c.box.x1) c.box.x1 = x;
    if (y < c.box.y0) c.box.y0 = y;
    if (y > c.box.y1) c.box.y1 = y;
    c.pixels += 1;
  }
  return boxes.slice(1).filter((c) => c.pixels > 0);
}

/** Tight bounds of foreground pixels inside `region`, or null if there are none. */
function tightBox(fg: Uint8Array, w: number, region: Box): Box | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let y = region.y0; y <= region.y1; y += 1) {
    const row = y * w;
    for (let x = region.x0; x <= region.x1; x += 1) {
      if (fg[row + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < x0 ? null : { x0, y0, x1, y1 };
}

/* ------------------------------------------------------------------ */
/* Generic "find ID-1 shaped blocks" detector                          */
/* ------------------------------------------------------------------ */

export type ExpectedCards = "one" | "two" | "one-or-two";

interface FindOptions {
  expected: ExpectedCards;
  /** Only look at this vertical band of the page (fractions 0..1). */
  roi?: { top: number; bottom: number };
  /** Minimum card width as a fraction of the page width. */
  minWidthFraction?: number;
  /** Accept a block covering (nearly) the whole page. */
  allowFullPage?: boolean;
}

interface Candidate {
  boxes: Box[];
  score: number;
  group: number;
}

const SINGLE_TOLERANCE = 0.16;
const HALF_TOLERANCE = 0.26;
const RADIUS_FRACTIONS = [0.03, 0.02, 0.012, 0.007, 0.004];
const NEAR_TIE = 0.04;
const MIN_CARD_DENSITY = 0.35;
const MIN_EDGE_SUPPORT = 0.45;
const MIN_MATCH_SCORE = 0.3;

/** 1 when the aspect matches exactly, 0 once it leaves the tolerance window. */
function aspectFit(width: number, height: number, target: number, tolerance: number): number {
  const ratio = width / height / target;
  return Math.max(0, 1 - Math.abs(Math.log(ratio)) / Math.log(1 + tolerance));
}

/**
 * Splits a block that contains two cards (side by side or stacked) at the
 * emptiest gap near its middle.
 */
function splitPair(fg: Uint8Array, w: number, box: Box, axis: "x" | "y"): [Box, Box] | null {
  const bw = boxWidth(box);
  const bh = boxHeight(box);
  const length = axis === "x" ? bw : bh;
  const cross = axis === "x" ? bh : bw;
  const profile = new Int32Array(length);
  for (let y = box.y0; y <= box.y1; y += 1) {
    for (let x = box.x0; x <= box.x1; x += 1) {
      if (fg[y * w + x]) profile[axis === "x" ? x - box.x0 : y - box.y0] += 1;
    }
  }
  const from = Math.floor(length * 0.35);
  const to = Math.ceil(length * 0.65);
  let min = Infinity;
  for (let i = from; i < to; i += 1) min = Math.min(min, profile[i]);
  const limit = Math.max(min, cross * 0.02);

  // Find the empty run (<= limit) that is closest to the centre.
  let bestStart = -1;
  let bestEnd = -1;
  let bestDistance = Infinity;
  let i = from;
  while (i < to) {
    if (profile[i] <= limit) {
      let j = i;
      while (j + 1 < to && profile[j + 1] <= limit) j += 1;
      const mid = (i + j) / 2;
      const distance = Math.abs(mid - length / 2);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestStart = i;
        bestEnd = j;
      }
      i = j + 1;
    } else {
      i += 1;
    }
  }
  if (bestStart < 0) return null;

  const first: Box =
    axis === "x"
      ? { x0: box.x0, y0: box.y0, x1: box.x0 + bestStart - 1, y1: box.y1 }
      : { x0: box.x0, y0: box.y0, x1: box.x1, y1: box.y0 + bestStart - 1 };
  const second: Box =
    axis === "x"
      ? { x0: box.x0 + bestEnd + 1, y0: box.y0, x1: box.x1, y1: box.y1 }
      : { x0: box.x0, y0: box.y0 + bestEnd + 1, x1: box.x1, y1: box.y1 };
  if (first.x1 < first.x0 || first.y1 < first.y0 || second.x1 < second.x0 || second.y1 < second.y0) {
    return null;
  }
  const a = tightBox(fg, w, first);
  const b = tightBox(fg, w, second);
  return a && b ? [a, b] : null;
}

/**
 * Distinguishes a card from a block of text that merely has a similar shape:
 * a card either fills much of its box (colour / photo / pattern) or has a
 * border / solid edges. Plain text on white has neither.
 */
function looksLikeCard(fg: Uint8Array, w: number, box: Box): boolean {
  let filled = 0;
  for (let y = box.y0; y <= box.y1; y += 1) {
    const row = y * w;
    for (let x = box.x0; x <= box.x1; x += 1) filled += fg[row + x];
  }
  if (filled / boxArea(box) >= MIN_CARD_DENSITY) return true;

  // Share of the outline (3 px band) that contains foreground.
  const band = 3;
  let hits = 0;
  let total = 0;
  for (let x = box.x0; x <= box.x1; x += 1) {
    let top = 0;
    let bottom = 0;
    for (let k = 0; k < band; k += 1) {
      top |= fg[(box.y0 + k) * w + x];
      bottom |= fg[(box.y1 - k) * w + x];
    }
    hits += top + bottom;
    total += 2;
  }
  for (let y = box.y0; y <= box.y1; y += 1) {
    let left = 0;
    let right = 0;
    for (let k = 0; k < band; k += 1) {
      left |= fg[y * w + box.x0 + k];
      right |= fg[y * w + box.x1 - k];
    }
    hits += left + right;
    total += 2;
  }
  return hits / total >= MIN_EDGE_SUPPORT;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x0 <= b.x1 && b.x0 <= a.x1 && a.y0 <= b.y1 && b.y0 <= a.y1;
}

/** Candidates (single cards, split pairs) found with one dilation radius. */
function collectCandidates(
  fg: Uint8Array,
  raster: Raster,
  radius: number,
  options: FindOptions,
): Candidate[] {
  const { width: w, height: h } = raster;
  const dilated = dilate(fg, w, h, radius);
  const { labels, count } = labelComponents(dilated, w, h);
  const components = componentBoxes(fg, labels, count, w);

  const minWidth = w * (options.minWidthFraction ?? 0.18);
  const minHeight = minWidth / PVC_ASPECT / 1.2;
  const maxArea = w * h * (options.allowFullPage ? 1.01 : 0.94);

  const singles: Candidate[] = [];
  const pairs: Candidate[] = [];
  // Big blocks are more likely to be the real card than small look-alikes
  // (e.g. a fragment of a card that happens to have a similar shape).
  const sizeWeight = (width: number): number => 0.6 + 0.4 * clamp(width / (w * 0.4), 0, 1);

  components.forEach((component, group) => {
    const box = component.box;
    const bw = boxWidth(box);
    const bh = boxHeight(box);
    if (bw < minWidth || bh < minHeight || boxArea(box) > maxArea) return;

    const single = aspectFit(bw, bh, PVC_ASPECT, SINGLE_TOLERANCE);
    if (single > 0 && looksLikeCard(fg, w, box)) {
      singles.push({ boxes: [box], score: single * sizeWeight(bw), group });
    }

    if (options.expected === "one") return;
    const ratio = bw / bh;
    let halves: [Box, Box] | null = null;
    if (ratio >= PVC_ASPECT * 2 * 0.9 && ratio <= PVC_ASPECT * 2 * 1.3) {
      halves = splitPair(fg, w, box, "x");
    } else if (ratio >= (PVC_ASPECT / 2) * 0.78 && ratio <= (PVC_ASPECT / 2) * 1.1) {
      halves = splitPair(fg, w, box, "y");
    }
    if (halves) {
      const fitA = aspectFit(boxWidth(halves[0]), boxHeight(halves[0]), PVC_ASPECT, HALF_TOLERANCE);
      const fitB = aspectFit(boxWidth(halves[1]), boxHeight(halves[1]), PVC_ASPECT, HALF_TOLERANCE);
      if (fitA > 0 && fitB > 0 && looksLikeCard(fg, w, halves[0]) && looksLikeCard(fg, w, halves[1])) {
        pairs.push({
          boxes: halves,
          score: ((fitA + fitB) / 2) * sizeWeight(Math.min(boxWidth(halves[0]), boxWidth(halves[1]))),
          group,
        });
      }
    }
  });

  return [...singles, ...pairs];
}

function pickBest(
  candidates: Candidate[],
  expected: ExpectedCards,
): { boxes: Box[]; score: number } | null {
  const singles = candidates.filter((c) => c.boxes.length === 1);
  const pairs = candidates.filter((c) => c.boxes.length === 2);

  const bestSingle = [...singles].sort((a, b) => b.score - a.score)[0];

  let bestTwo: { boxes: Box[]; score: number } | null = null;
  for (const p of pairs) {
    if (!bestTwo || p.score > bestTwo.score) bestTwo = { boxes: p.boxes, score: p.score };
  }
  for (let i = 0; i < singles.length; i += 1) {
    for (let j = i + 1; j < singles.length; j += 1) {
      const a = singles[i].boxes[0];
      const b = singles[j].boxes[0];
      const widthRatio = boxWidth(a) / boxWidth(b);
      if (widthRatio < 0.8 || widthRatio > 1.25 || overlaps(a, b)) continue;
      const score = (singles[i].score + singles[j].score) / 2;
      if (!bestTwo || score > bestTwo.score) bestTwo = { boxes: [a, b], score };
    }
  }

  if (expected === "two") return bestTwo;
  if (expected === "one") return bestSingle ? { boxes: bestSingle.boxes, score: bestSingle.score } : null;
  if (bestTwo && bestTwo.score >= 0.4) return bestTwo;
  return bestSingle ? { boxes: bestSingle.boxes, score: bestSingle.score } : null;
}

interface FoundCards {
  boxes: Box[];
  score: number;
  raster: Raster;
}

/**
 * Finds ID-1 (85.6 x 53.98) shaped blocks on a page.
 *
 * 1. Estimate the page background from the border (works for white pages and
 *    for the black backdrop on e-EPIC PDFs).
 * 2. Mark everything that differs from the background.
 * 3. For decreasing dilation radii merge nearby content, label the blobs and
 *    keep blobs (or halves of a two-card blob) that have the card aspect ratio.
 */
function findCards(page: PageSource, options: FindOptions): FoundCards | null {
  const raster = rasterize(page);
  const { width: w, height: h } = raster;
  const bg = estimateBackground(raster);
  const fg = foregroundMask(raster, bg);

  if (options.roi) {
    const top = Math.floor(clamp(options.roi.top, 0, 1) * h);
    const bottom = Math.ceil(clamp(options.roi.bottom, 0, 1) * h);
    fg.fill(0, 0, top * w);
    fg.fill(0, bottom * w);
  }

  // Try every radius and keep the best match. Larger radii come first, so on a
  // near-tie the more coherent (more merged) result wins.
  let best: { boxes: Box[]; score: number } | null = null;
  for (const fraction of RADIUS_FRACTIONS) {
    const radius = Math.max(2, Math.round(w * fraction));
    const found = pickBest(collectCandidates(fg, raster, radius, options), options.expected);
    if (found && (!best || found.score > best.score + NEAR_TIE)) best = found;
  }
  return best && best.score >= MIN_MATCH_SCORE ? { boxes: best.boxes, score: best.score, raster } : null;
}

function boxToPageRect(box: Box, raster: Raster, page: PageSource): Rect {
  return clampRect(
    {
      x: box.x0 / raster.scale,
      y: box.y0 / raster.scale,
      width: boxWidth(box) / raster.scale,
      height: boxHeight(box) / raster.scale,
    },
    { width: page.width, height: page.height },
  );
}

/** Front = left card (or top card when stacked). */
function orderBoxes(boxes: Box[]): Box[] {
  if (boxes.length < 2) return boxes;
  const [a, b] = boxes;
  const avgHeight = (boxHeight(a) + boxHeight(b)) / 2;
  const centreA = (a.y0 + a.y1) / 2;
  const centreB = (b.y0 + b.y1) / 2;
  const sideBySide = Math.abs(centreA - centreB) < avgHeight * 0.5;
  const first = sideBySide ? (a.x0 <= b.x0 ? a : b) : a.y0 <= b.y0 ? a : b;
  return [first, first === a ? b : a];
}

function toCards(found: FoundCards, page: PageSource, method: string): DetectedCards {
  const ordered = orderBoxes(found.boxes);
  return {
    front: { pageIndex: page.index, rect: boxToPageRect(ordered[0], found.raster, page) },
    back: ordered[1]
      ? { pageIndex: page.index, rect: boxToPageRect(ordered[1], found.raster, page) }
      : null,
    method,
    confidence: found.score,
  };
}

/* ------------------------------------------------------------------ */
/* Colour segmentation (PAN)                                           */
/* ------------------------------------------------------------------ */

/** Blue / cyan test in HSV: hue 165–245°, some saturation, not too dark. */
function isBlueish(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max < 115) return false;
  const saturation = (max - min) / max;
  if (saturation < 0.09) return false;
  const delta = max - min;
  let hue: number;
  if (max === r) hue = 60 * (((g - b) / delta + 6) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  return hue >= 165 && hue <= 245;
}

function detectBlueRegion(page: PageSource): FoundCards | null {
  const raster = rasterize(page);
  const { width: w, height: h, data } = raster;
  const mask = new Uint8Array(w * h);
  for (let p = 0, i = 0; p < mask.length; p += 1, i += 4) {
    if (isBlueish(data[i], data[i + 1], data[i + 2])) mask[p] = 1;
  }

  const radius = Math.max(2, Math.round(w * 0.008));
  const { labels, count } = labelComponents(dilate(mask, w, h, radius), w, h);
  const components = componentBoxes(mask, labels, count, w);
  if (components.length === 0) return null;

  const biggest = components.reduce((a, b) => (b.pixels > a.pixels ? b : a));
  let box = biggest.box;
  if (boxWidth(box) < w * 0.18 || boxArea(box) < w * h * 0.02) return null;

  const fit = aspectFit(boxWidth(box), boxHeight(box), PVC_ASPECT, 0.4);
  if (fit <= 0) return null;

  // Nudge slightly-off boxes to the exact card ratio around their centre.
  const ratio = boxWidth(box) / boxHeight(box);
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  let newW = boxWidth(box);
  let newH = boxHeight(box);
  if (ratio > PVC_ASPECT * 1.04) newH = newW / PVC_ASPECT;
  else if (ratio < PVC_ASPECT / 1.04) newW = newH * PVC_ASPECT;
  box = {
    x0: Math.max(0, Math.round(cx - newW / 2)),
    y0: Math.max(0, Math.round(cy - newH / 2)),
    x1: Math.min(w - 1, Math.round(cx + newW / 2) - 1),
    y1: Math.min(h - 1, Math.round(cy + newH / 2) - 1),
  };
  return { boxes: [box], score: Math.min(1, 0.4 + fit * 0.6), raster };
}

/* ------------------------------------------------------------------ */
/* Per-card strategies                                                 */
/* ------------------------------------------------------------------ */

function fail(reason: string = DETECTION_FAILED_MESSAGE): DetectionOutcome {
  return { ok: false, reason };
}

/**
 * West Bengal e-Ration Card: page 1 carries the Front and Back card images in
 * its lower part. Look there first, then fall back to the whole page.
 */
export function detectRationCard(pages: PageSource[]): DetectionOutcome {
  const page = pages[0];
  if (!page) return fail();
  const lower = findCards(page, { expected: "two", roi: { top: 0.3, bottom: 1 } });
  const found = lower ?? findCards(page, { expected: "two" });
  return found ? { ok: true, cards: toCards(found, page, "ration-lower-cards") } : fail();
}

/**
 * ECI e-EPIC (Voter) PDF: front/back are shown on a dark backdrop, either both
 * on page 1 or one per page.
 */
export function detectVoterCard(pages: PageSource[]): DetectionOutcome {
  const collected: Array<{ page: PageSource; found: FoundCards }> = [];
  for (const page of pages.slice(0, 2)) {
    const found = findCards(page, { expected: "one-or-two" });
    if (found) collected.push({ page, found });
    if (found && found.boxes.length === 2) break;
    if (collected.length === 2) break;
  }
  if (collected.length === 0) return fail();

  const first = collected[0];
  if (first.found.boxes.length === 2) {
    return { ok: true, cards: toCards(first.found, first.page, "voter-pair") };
  }
  const front = toCards(first.found, first.page, "voter-pages");
  const second = collected[1];
  if (second) {
    const back = toCards(second.found, second.page, "voter-pages");
    return {
      ok: true,
      cards: {
        front: front.front,
        back: back.front,
        method: "voter-pages",
        confidence: Math.min(front.confidence, back.confidence),
      },
    };
  }
  return { ok: true, cards: front };
}

/**
 * PAN: the card is the large blue/cyan area. Colour segmentation first; if the
 * image has no such area (e.g. Aadhaar or another ID) use the generic detector.
 */
export function detectPanCard(pages: PageSource[]): DetectionOutcome {
  const page = pages[0];
  if (!page) return fail();
  const byColour = detectBlueRegion(page);
  if (byColour) return { ok: true, cards: toCards(byColour, page, "pan-blue-area") };
  const generic = findCards(page, { expected: "one-or-two" });
  return generic ? { ok: true, cards: toCards(generic, page, "generic-cards") } : fail();
}

/** Aadhaar: no colour prior; uses the generic detector (front, optional back). */
export function detectAadhaarCard(pages: PageSource[]): DetectionOutcome {
  const page = pages[0];
  if (!page) return fail();
  const found = findCards(page, { expected: "one-or-two" });
  return found ? { ok: true, cards: toCards(found, page, "generic-cards") } : fail();
}

/** Ayushman: page 1 = front, page 2 = back; each page is fitted to the PVC size. */
export function detectAyushmanCard(pages: PageSource[]): DetectionOutcome {
  if (pages.length < 2) {
    return fail("The Ayushman PDF must have 2 pages (front and back).");
  }
  let confidence = 1;
  const placements = pages.slice(0, 2).map((page): Placement => {
    const whole: Rect = { x: 0, y: 0, width: page.width, height: page.height };
    // A page that already has the card shape *is* the card.
    if (Math.abs(page.width / page.height / PVC_ASPECT - 1) <= 0.12) {
      return { pageIndex: page.index, rect: whole };
    }
    const found = findCards(page, { expected: "one", allowFullPage: true });
    if (found) {
      confidence = Math.min(confidence, found.score);
      return { pageIndex: page.index, rect: boxToPageRect(found.boxes[0], found.raster, page) };
    }
    confidence = Math.min(confidence, 0.3);
    return { pageIndex: page.index, rect: whole };
  });
  return {
    ok: true,
    cards: { front: placements[0], back: placements[1], method: "ayushman-pages", confidence },
  };
}

/** ABC / APAAR: the card sits in the upper part of the certificate page. */
export function detectAbcCard(pages: PageSource[]): DetectionOutcome {
  const page = pages[0];
  if (!page) return fail();
  const upper = findCards(page, { expected: "one", roi: { top: 0, bottom: 0.6 } });
  const found = upper ?? findCards(page, { expected: "one" });
  return found ? { ok: true, cards: toCards(found, page, "abc-upper-card") } : fail();
}

export function detectCards(strategy: DetectionStrategy, pages: PageSource[]): DetectionOutcome {
  switch (strategy) {
    case "ration":
      return detectRationCard(pages);
    case "voter":
      return detectVoterCard(pages);
    case "pan":
      return detectPanCard(pages);
    case "ayushman":
      return detectAyushmanCard(pages);
    case "abc":
      return detectAbcCard(pages);
  }
}

/** Starting crop box for Manual Crop when detection fails (PVC ratio, centred). */
export function suggestManualCrop(page: PageSource, aspect: number = PVC_ASPECT): Rect {
  let width = page.width * 0.7;
  let height = width / aspect;
  if (height > page.height * 0.7) {
    height = page.height * 0.7;
    width = height * aspect;
  }
  return {
    x: (page.width - width) / 2,
    y: (page.height - height) / 2,
    width,
    height,
  };
}
