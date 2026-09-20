"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ADJUSTMENT_LABELS,
  ADJUSTMENT_RANGES,
  isNeutral,
} from "@/lib/card-crop/adjustments";
import type { AdjustmentKey } from "@/lib/card-crop/adjustments";
import { estimateCardJpegSize, renderCardAtDpi } from "@/lib/card-crop/exports";
import type { CardImage } from "@/lib/card-crop/exports";
import {
  INDIVIDUAL_JPG_DPI,
  PVC_HEIGHT_MM,
  PVC_WIDTH_MM,
  getPvcPixelSize,
} from "@/lib/card-crop/resize";
import { formatBytes } from "@/lib/card-crop/utils";

interface CardPreviewProps {
  title: string;
  downloadLabel: string;
  image: CardImage;
  busy?: boolean;
  onChange: (key: AdjustmentKey, value: number) => void;
  onReset: () => void;
  onDownload: () => void;
}

const SLIDER_KEYS: AdjustmentKey[] = ["brightness", "contrast", "saturation"];
const PREVIEW_DPI = 300;

/** One card side: live preview (adjustments applied to the pixels) + sliders + download. */
export default function CardPreview({
  title,
  downloadLabel,
  image,
  busy,
  onChange,
  onReset,
  onDownload,
}: CardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idPrefix = useId();
  const [bytes, setBytes] = useState<number | null>(null);
  const exportSize = getPvcPixelSize(INDIVIDUAL_JPG_DPI);
  const previewSize = getPvcPixelSize(PREVIEW_DPI);

  // Draw the adjusted preview. Uses the same pixel pipeline as the export.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const adjusted = renderCardAtDpi(image, PREVIEW_DPI);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(adjusted, 0, 0, canvas.width, canvas.height);
    });
    return () => cancelAnimationFrame(frame);
  }, [image]);

  // Real JPG size of the file that will be downloaded (debounced).
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      estimateCardJpegSize(image)
        .then((size) => {
          if (!cancelled) setBytes(size);
        })
        .catch(() => {
          if (!cancelled) setBytes(null);
        });
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [image]);

  return (
    <section className="cc-card p-3 sm:p-4" aria-label={title}>
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-base font-extrabold">{title}</h3>
        <span className="cc-muted text-[11px] font-semibold">
          {PVC_WIDTH_MM.toFixed(2)} × {PVC_HEIGHT_MM.toFixed(2)} mm
        </span>
      </header>

      <div className="cc-inset p-2">
        <canvas
          ref={canvasRef}
          width={previewSize.width}
          height={previewSize.height}
          role="img"
          aria-label={`${title} preview`}
          className="block h-auto w-full rounded-lg bg-white"
        />
      </div>
      <p className="cc-muted mt-2 text-[11px] leading-snug">
        {exportSize.width} × {exportSize.height} px • {INDIVIDUAL_JPG_DPI} DPI HQ
        {bytes !== null ? ` • ${formatBytes(bytes)}` : ""}
      </p>

      <div className="cc-inset mt-3 p-3">
        <p className="cc-accent-text mb-3 text-xs font-extrabold">
          Brightness / Contrast / Saturation
        </p>
        <div className="space-y-3">
          {SLIDER_KEYS.map((key) => {
            const range = ADJUSTMENT_RANGES[key];
            const id = `${idPrefix}-${key}`;
            return (
              <div key={key} className="grid grid-cols-[4.75rem_1fr_3rem] items-center gap-2.5 text-xs">
                <label htmlFor={id} className="font-bold">
                  {ADJUSTMENT_LABELS[key]}
                </label>
                <input
                  id={id}
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={1}
                  value={image.adjustments[key]}
                  onChange={(event) => onChange(key, Number(event.target.value))}
                  className="h-6 w-full cursor-pointer"
                />
                <output htmlFor={id} className="cc-value py-1">
                  {image.adjustments[key]}%
                </output>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onReset}
            disabled={isNeutral(image.adjustments)}
            className="cc-btn cc-btn-sm"
          >
            ↺ Reset 100%
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onDownload}
        disabled={busy}
        className="cc-btn cc-btn-primary cc-btn-block mt-3"
      >
        {downloadLabel}
      </button>
    </section>
  );
}
