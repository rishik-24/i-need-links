"use client";

import { DPI_OPTIONS } from "@/lib/card-crop/resize";
import type { Dpi } from "@/lib/card-crop/resize";

interface OutputSettingsProps {
  dpi: Dpi;
  onChange: (dpi: Dpi) => void;
}

const DPI_LABELS: Record<Dpi, string> = {
  300: "300 DPI • Normal",
  600: "600 DPI • High Resolution",
};

/** DPI picker. Applies to the A4 and 4×6 print files; single JPGs are always 600 DPI. */
export default function OutputSettings({ dpi, onChange }: OutputSettingsProps) {
  return (
    <fieldset className="cc-card p-4">
      <legend className="sr-only">Print resolution</legend>
      <p className="mb-2 text-xs font-extrabold">Print Resolution</p>
      <div className="cc-seg w-full" role="radiogroup" aria-label="Print resolution">
        {DPI_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === dpi}
            onClick={() => onChange(option)}
            className="flex-1"
          >
            {DPI_LABELS[option]}
          </button>
        ))}
      </div>
      <p className="cc-muted mt-2 text-[11px] leading-snug">
        এই selection শুধু A4 ও 4×6 print download-এর জন্য। Front/Back individual JPG আগের মতো High
        Resolution (600 DPI)-ই থাকবে।
      </p>
    </fieldset>
  );
}
