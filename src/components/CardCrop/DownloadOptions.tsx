"use client";

import { MAX_A4_PAIRS } from "@/lib/card-crop/resize";

interface DownloadOptionsProps {
  hasResult: boolean;
  /** Number of pairs already stored on the A4 sheet. */
  basketCount: number;
  canAddToA4: boolean;
  /** Pairs that will be printed on the A4 sheet (stored + current). */
  sheetPairCount: number;
  /** Name of the running export ("both", "a4", …) or null. */
  exporting: string | null;
  error: string | null;
  onDownloadBoth: () => void;
  onAddToA4: () => void;
  onA4Jpeg: () => void;
  onA4Pdf: () => void;
  on4x6: () => void;
  onOpenA4Layout: () => void;
}

export default function DownloadOptions({
  hasResult,
  basketCount,
  canAddToA4,
  sheetPairCount,
  exporting,
  error,
  onDownloadBoth,
  onAddToA4,
  onA4Jpeg,
  onA4Pdf,
  on4x6,
  onOpenA4Layout,
}: DownloadOptionsProps) {
  const busy = exporting !== null;
  const a4Disabled = busy || sheetPairCount === 0;
  const working = (name: string, idle: string): string => (exporting === name ? "Preparing…" : idle);

  return (
    <div className="cc-card space-y-2.5 p-4">
      <p className="text-xs font-extrabold">Download</p>

      <button
        type="button"
        className="cc-btn cc-btn-block"
        disabled={!hasResult || busy}
        onClick={onDownloadBoth}
      >
        {working("both", "Download Both")}
      </button>

      <button
        type="button"
        className="cc-btn cc-btn-block"
        disabled={!canAddToA4 || busy}
        onClick={onAddToA4}
      >
        + Add More to A4 ({basketCount}/{MAX_A4_PAIRS})
      </button>
      <p className="cc-inset cc-muted px-3 py-2 text-[11px] leading-snug">
        একটি PDF crop শেষ হলে Add More চাপুন → পরের PDF upload/crop করুন → সর্বোচ্চ {MAX_A4_PAIRS}টি pair এক
        A4-এ।
      </p>

      <button
        type="button"
        className="cc-btn cc-btn-primary cc-btn-block"
        disabled={a4Disabled}
        onClick={onA4Jpeg}
      >
        {working("a4", "A4 Printable Download")}
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="cc-btn" disabled={a4Disabled} onClick={onA4Pdf}>
          {working("a4pdf", "A4 as PDF")}
        </button>
        <button type="button" className="cc-btn" disabled={sheetPairCount === 0} onClick={onOpenA4Layout}>
          A4 Card Position
        </button>
      </div>
      <button
        type="button"
        className="cc-btn cc-btn-primary cc-btn-block"
        disabled={!hasResult || busy}
        onClick={on4x6}
      >
        {working("4x6", "4 × 6 Page Print")}
      </button>

      {error ? (
        <p role="alert" className="cc-notice cc-notice-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
