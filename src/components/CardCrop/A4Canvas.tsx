"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { CardSide, LayoutPair } from "@/hooks/useCardCrop";
import { renderCardAtDpi } from "@/lib/card-crop/exports";
import type { CardImage } from "@/lib/card-crop/exports";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  PVC_HEIGHT_MM,
  PVC_WIDTH_MM,
} from "@/lib/card-crop/resize";
import type { Point } from "@/lib/card-crop/utils";

interface A4CanvasProps {
  pairs: LayoutPair[];
  onMove: (pairId: string, side: CardSide, point: Point) => void;
  onReset: () => void;
  onRemove: (pairId: string) => void;
}

const THUMB_DPI = 150;

/** Draws a small copy of a card once per (image, adjustments). */
const CardThumb = memo(function CardThumb({ image }: { image: CardImage }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const thumb = renderCardAtDpi(image, THUMB_DPI);
    canvas.width = thumb.width;
    canvas.height = thumb.height;
    ctx.drawImage(thumb, 0, 0);
  }, [image]);
  return (
    <canvas
      ref={ref}
      className="pointer-events-none block h-full w-full"
    />
  );
});

interface DragState {
  key: string;
  pairId: string;
  side: CardSide;
  startX: number;
  startY: number;
  origin: Point;
}

/**
 * A4 sheet with draggable cards. Positions are stored in millimetres; a card's
 * on-screen size is always exactly 85.60 x 53.98 mm at the sheet's scale, so
 * moving never changes the physical size.
 */
export default function A4Canvas({
  pairs,
  onMove,
  onReset,
  onRemove,
}: A4CanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(320);
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<DragState | null>(null);

  const pxPerMm = pageWidth / A4_WIDTH_MM;
  const pageHeight = A4_HEIGHT_MM * pxPerMm;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = (): void =>
      setPageWidth(Math.max(200, Math.min(560, el.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const begin =
    (pairId: string, side: CardSide, origin: Point) =>
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const key = `${pairId}:${side}`;
      setSelected(key);
      drag.current = {
        key,
        pairId,
        side,
        startX: event.clientX,
        startY: event.clientY,
        origin,
      };
    };

  const move = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (!state) return;
    onMove(state.pairId, state.side, {
      x: state.origin.x + (event.clientX - state.startX) / pxPerMm,
      y: state.origin.y + (event.clientY - state.startY) / pxPerMm,
    });
  };

  const end = (): void => {
    drag.current = null;
  };

  const nudge =
    (pairId: string, side: CardSide, origin: Point) =>
    (event: KeyboardEvent<HTMLDivElement>): void => {
      const step = event.shiftKey ? 5 : 0.5;
      const next = { ...origin };
      if (event.key === "ArrowLeft") next.x -= step;
      else if (event.key === "ArrowRight") next.x += step;
      else if (event.key === "ArrowUp") next.y -= step;
      else if (event.key === "ArrowDown") next.y += step;
      else return;
      event.preventDefault();
      onMove(pairId, side, next);
    };

  const selectedPoint = ((): Point | null => {
    for (const pair of pairs) {
      if (selected === `${pair.id}:front`) return pair.frontPos;
      if (selected === `${pair.id}:back` && pair.backPos) return pair.backPos;
    }
    return null;
  })();

  const renderCard = (
    pair: LayoutPair,
    side: CardSide,
    image: CardImage,
    point: Point,
  ) => {
    const key = `${pair.id}:${side}`;
    const isSelected = selected === key;
    return (
      <div
        key={key}
        role="group"
        tabIndex={0}
        aria-label={`${pair.label} ${side}`}
        onPointerDown={begin(pair.id, side, point)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={nudge(pair.id, side, point)}
        onFocus={() => setSelected(key)}
        className={[
          "absolute cursor-grab touch-none overflow-hidden outline-1 outline-dashed active:cursor-grabbing",
          "focus:outline-2 focus:outline-(--cc-accent)",
          isSelected ?
            "z-10 outline-2 outline-(--cc-accent)"
          : "outline-slate-400",
        ].join(" ")}
        style={{
          left: point.x * pxPerMm,
          top: point.y * pxPerMm,
          width: PVC_WIDTH_MM * pxPerMm,
          height: PVC_HEIGHT_MM * pxPerMm,
        }}>
        <CardThumb image={image} />
        <span className="pointer-events-none absolute top-1 left-1 rounded bg-black/60 px-1 text-[9px] font-semibold text-white">
          {pair.label} • {side === "front" ? "Front" : "Back"}
        </span>
      </div>
    );
  };

  return (
    <section
      className="cc-card p-3 sm:p-4"
      aria-label="A4 card position">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold">A4 Card Position</h3>
          <p className="cc-muted text-[11px] leading-snug">
            Drag cards anywhere on the A4 sheet (or use arrow keys). Each card
            stays exactly {PVC_WIDTH_MM.toFixed(2)} × {PVC_HEIGHT_MM.toFixed(2)}{" "}
            mm.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="cc-btn cc-btn-sm">
          Reset layout
        </button>
      </div>

      {pairs.length === 0 ?
        <p className="cc-inset cc-muted p-6 text-center text-xs">
          No cards on the A4 sheet yet. Crop a card and press “Add More to A4”.
        </p>
      : <div
          ref={wrapperRef}
          className="flex justify-center">
          <div
            className="relative bg-white shadow-[0_2px_16px_rgba(15,23,42,0.25)]"
            style={{ width: pageWidth, height: pageHeight }}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setSelected(null);
            }}>
            {pairs.map((pair) => [
              renderCard(pair, "front", pair.front, pair.frontPos),
              pair.back && pair.backPos ?
                renderCard(pair, "back", pair.back, pair.backPos)
              : null,
            ])}
          </div>
        </div>
      }

      <p
        className="cc-muted mt-2 min-h-4 text-[11px] tabular-nums"
        aria-live="polite">
        {selectedPoint ?
          `Selected card: X ${selectedPoint.x.toFixed(1)} mm • Y ${selectedPoint.y.toFixed(1)} mm`
        : ""}
      </p>

      {pairs.length > 0 ?
        <ul className="mt-2 flex flex-wrap gap-2">
          {pairs.map((pair) => (
            <li
              key={pair.id}
              className="cc-pill">
              {pair.label}
              {pair.isCurrent ? null : (
                <button
                  type="button"
                  onClick={() => onRemove(pair.id)}
                  aria-label={`Remove ${pair.label} from A4`}
                  className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600">
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      : null}
    </section>
  );
}
