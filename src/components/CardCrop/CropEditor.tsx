"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { suggestManualCrop } from "@/lib/card-crop/detection";
import type { Placement } from "@/lib/card-crop/detection";
import type { PageSource } from "@/lib/card-crop/pdf";
import { PVC_HEIGHT_MM, PVC_WIDTH_MM } from "@/lib/card-crop/resize";
import { clamp } from "@/lib/card-crop/utils";
import type { Rect } from "@/lib/card-crop/utils";

type Side = "front" | "back";
type DragMode = "move" | "nw" | "ne" | "sw" | "se";

interface CropEditorProps {
  pages: PageSource[];
  initial: { front: Placement; back: Placement | null } | null;
  /** Locked width / height ratio of the crop box. */
  aspect: number;
  busy?: boolean;
  canCancel: boolean;
  onApply: (front: Placement, back: Placement | null) => void;
  onCancel: () => void;
}

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  startRect: Rect;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function resizeRect(
  mode: Exclude<DragMode, "move">,
  start: Rect,
  dx: number,
  dy: number,
  page: PageSource,
  aspect: number,
): Rect {
  const minWidth = page.width * 0.05;
  let ax: number;
  let ay: number;
  let width: number;
  let maxWidth: number;

  if (mode === "se") {
    ax = start.x;
    ay = start.y;
    width = Math.max(start.width + dx, (start.height + dy) * aspect);
    maxWidth = Math.min(page.width - ax, (page.height - ay) * aspect);
  } else if (mode === "nw") {
    ax = start.x + start.width;
    ay = start.y + start.height;
    width = Math.max(start.width - dx, (start.height - dy) * aspect);
    maxWidth = Math.min(ax, ay * aspect);
  } else if (mode === "ne") {
    ax = start.x;
    ay = start.y + start.height;
    width = Math.max(start.width + dx, (start.height - dy) * aspect);
    maxWidth = Math.min(page.width - ax, ay * aspect);
  } else {
    ax = start.x + start.width;
    ay = start.y;
    width = Math.max(start.width - dx, (start.height + dy) * aspect);
    maxWidth = Math.min(ax, (page.height - ay) * aspect);
  }

  width = clamp(width, Math.min(minWidth, maxWidth), maxWidth);
  const height = width / aspect;
  const x = mode === "nw" || mode === "sw" ? ax - width : ax;
  const y = mode === "nw" || mode === "ne" ? ay - height : ay;
  return { x, y, width, height };
}

export default function CropEditor({
  pages,
  initial,
  aspect,
  busy,
  canCancel,
  onApply,
  onCancel,
}: CropEditorProps) {
  const fallbackPage = pages[0];

  const [crops, setCrops] = useState<Record<Side, Placement>>(() => {
    const front: Placement = initial?.front ?? {
      pageIndex: 0,
      rect: suggestManualCrop(fallbackPage, aspect),
    };
    const backPage = pages[Math.min(1, pages.length - 1)] ?? fallbackPage;
    const back: Placement = initial?.back ?? {
      pageIndex: backPage.index,
      rect: suggestManualCrop(backPage, aspect),
    };
    return { front, back };
  });
  const [includeBack, setIncludeBack] = useState<boolean>(
    initial?.back != null,
  );
  const [side, setSide] = useState<Side>("front");
  const [zoom, setZoom] = useState(1);
  const [viewWidth, setViewWidth] = useState(600);

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<DragState | null>(null);

  const active = crops[side];
  const page = pages[active.pageIndex] ?? fallbackPage;
  const displayWidth = viewWidth * zoom;
  const displayScale = displayWidth / page.width; // CSS px per page unit
  const displayHeight = page.height * displayScale;

  // Fit the page to the available width; follow container resizes.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = (): void => setViewWidth(Math.max(240, el.clientWidth - 2));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Paint the rendered page.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = page.preview.width;
    canvas.height = page.preview.height;
    canvas.getContext("2d")?.drawImage(page.preview, 0, 0);
  }, [page]);

  const setRect = (next: Rect): void => {
    setCrops((prev) => ({ ...prev, [side]: { ...prev[side], rect: next } }));
  };

  const startDrag =
    (mode: DragMode) =>
    (event: ReactPointerEvent<HTMLElement>): void => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = {
        mode,
        startX: event.clientX,
        startY: event.clientY,
        startRect: active.rect,
      };
    };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>): void => {
    const state = drag.current;
    if (!state) return;
    event.stopPropagation();
    const dx = (event.clientX - state.startX) / displayScale;
    const dy = (event.clientY - state.startY) / displayScale;
    if (state.mode === "move") {
      setRect({
        ...state.startRect,
        x: clamp(state.startRect.x + dx, 0, page.width - state.startRect.width),
        y: clamp(
          state.startRect.y + dy,
          0,
          page.height - state.startRect.height,
        ),
      });
    } else {
      setRect(resizeRect(state.mode, state.startRect, dx, dy, page, aspect));
    }
  };

  const endDrag = (): void => {
    drag.current = null;
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const step = (event.shiftKey ? 10 : 1) / Math.max(displayScale, 0.1);
    const { rect } = active;
    let { x, y } = rect;
    if (event.key === "ArrowLeft") x -= step;
    else if (event.key === "ArrowRight") x += step;
    else if (event.key === "ArrowUp") y -= step;
    else if (event.key === "ArrowDown") y += step;
    else return;
    event.preventDefault();
    setRect({
      ...rect,
      x: clamp(x, 0, page.width - rect.width),
      y: clamp(y, 0, page.height - rect.height),
    });
  };

  const changePage = (index: number): void => {
    const target = pages[index];
    if (!target) return;
    setCrops((prev) => ({
      ...prev,
      [side]: {
        pageIndex: target.index,
        rect: suggestManualCrop(target, aspect),
      },
    }));
  };

  const resetCrop = (): void => {
    const original = initial?.[side];
    if (original) {
      setCrops((prev) => ({ ...prev, [side]: original }));
    } else {
      setRect(suggestManualCrop(page, aspect));
    }
  };

  const apply = (): void => {
    onApply(crops.front, includeBack ? crops.back : null);
  };

  const box = useMemo(
    () => ({
      left: active.rect.x * displayScale,
      top: active.rect.y * displayScale,
      width: active.rect.width * displayScale,
      height: active.rect.height * displayScale,
    }),
    [active.rect, displayScale],
  );

  const handleClass =
    "absolute h-6 w-6 rounded-full border-2 border-white bg-[var(--cc-accent)] shadow touch-none sm:h-4 sm:w-4";

  return (
    <section
      className="cc-card p-3 sm:p-4"
      aria-label="Manual crop">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          role="tablist"
          aria-label="Card side"
          className="cc-seg">
          {(["front", "back"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={side === s}
              onClick={() => setSide(s)}
              className={s === "back" && !includeBack ? "opacity-60" : ""}>
              {s === "front" ? "Front Side" : "Back Side"}
            </button>
          ))}
        </div>

        <label className="flex min-h-10 items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={includeBack}
            onChange={(event) => {
              setIncludeBack(event.target.checked);
              setSide(event.target.checked ? "back" : "front");
            }}
            className="h-4 w-4"
          />
          Include back side
        </label>

        {pages.length > 1 ?
          <label className="flex min-h-10 items-center gap-2 text-xs font-bold">
            Page
            <select
              value={active.pageIndex}
              onChange={(event) => changePage(Number(event.target.value))}
              className="cc-input cc-input-sm">
              {pages.map((p) => (
                <option
                  key={p.id}
                  value={p.index}>
                  {p.index + 1}
                </option>
              ))}
            </select>
          </label>
        : null}

        <div className="flex w-full items-center gap-2 text-xs font-bold sm:ml-auto sm:w-auto">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => clamp(z - 0.25, MIN_ZOOM, MAX_ZOOM))}
            className="cc-btn cc-btn-icon">
            −
          </button>
          <input
            type="range"
            aria-label="Zoom"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="h-6 min-w-0 flex-1 sm:w-28 sm:flex-none"
          />
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => clamp(z + 0.25, MIN_ZOOM, MAX_ZOOM))}
            className="cc-btn cc-btn-icon">
            +
          </button>
          <span className="w-11 text-right tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      <p className="cc-muted mb-2 text-[11px] leading-snug">
        Drag the box to move it, drag a corner to resize. Ratio is locked to{" "}
        {PVC_WIDTH_MM.toFixed(2)} : {PVC_HEIGHT_MM.toFixed(2)}. Arrow keys nudge
        the box.
      </p>

      <div
        ref={viewportRef}
        className="cc-inset max-h-[62vh] overflow-auto overscroll-contain">
        <div
          className="relative select-none"
          style={{ width: displayWidth, height: displayHeight }}>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Rendered page"
            className="absolute inset-0 h-full w-full"
          />
          {/* Crop box; the huge shadow dims everything outside it. */}
          <div
            role="group"
            tabIndex={0}
            aria-label={`${side} crop box`}
            onKeyDown={handleKey}
            onPointerDown={startDrag("move")}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="absolute cursor-move touch-none border-2 border-(--cc-accent) shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]"
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
            }}>
            {(["nw", "ne", "sw", "se"] as const).map((corner) => (
              <span
                key={corner}
                aria-hidden="true"
                onPointerDown={startDrag(corner)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={[
                  handleClass,
                  corner === "nw" ?
                    "-top-3 -left-3 cursor-nwse-resize sm:-top-2 sm:-left-2"
                  : "",
                  corner === "ne" ?
                    "-top-3 -right-3 cursor-nesw-resize sm:-top-2 sm:-right-2"
                  : "",
                  corner === "sw" ?
                    "-bottom-3 -left-3 cursor-nesw-resize sm:-bottom-2 sm:-left-2"
                  : "",
                  corner === "se" ?
                    "-right-3 -bottom-3 cursor-nwse-resize sm:-right-2 sm:-bottom-2"
                  : "",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={apply}
          disabled={busy}
          className="cc-btn cc-btn-primary col-span-2 sm:col-span-1">
          {busy ? "Applying…" : "Apply Crop"}
        </button>
        <button
          type="button"
          onClick={resetCrop}
          className="cc-btn">
          Reset Crop
        </button>
        {canCancel ?
          <button
            type="button"
            onClick={onCancel}
            className="cc-btn">
            Cancel
          </button>
        : null}
      </div>
    </section>
  );
}
