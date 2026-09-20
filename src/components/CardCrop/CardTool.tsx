"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import A4Canvas from "./A4Canvas";
import CardPreview from "./CardPreview";
import CropEditor from "./CropEditor";
import DownloadOptions from "./DownloadOptions";
import FileUploader from "./FileUploader";
import OutputSettings from "./OutputSettings";
import type { CardCropController, Notice } from "@/hooks/useCardCrop";
import { PVC_ASPECT } from "@/lib/card-crop/resize";

interface CardToolProps {
  crop: CardCropController;
}

const NOTICE_CLASS: Record<Notice["kind"], string> = {
  success: "cc-notice-success",
  info: "cc-notice-info",
  error: "cc-notice-error",
};

function PasswordForm({
  wrong,
  busy,
  onSubmit,
}: {
  wrong: boolean;
  busy: boolean;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const id = useId();

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (password) onSubmit(password);
  };

  return (
    <form
      onSubmit={submit}
      className="cc-notice cc-notice-warn space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-extrabold">
        This PDF is password protected. Enter the password:
      </label>
      <input
        id={id}
        type="password"
        autoComplete="off"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="cc-input"
      />
      {wrong ?
        <p className="text-[11px] font-bold">Incorrect password. Try again.</p>
      : null}
      <button
        type="submit"
        disabled={busy || !password}
        className="cc-btn cc-btn-primary cc-btn-block">
        Unlock PDF
      </button>
    </form>
  );
}

/**
 * The tool window. Mobile: full-screen, one column in the order
 * controls -> previews -> print options (+ a sticky quick-download bar).
 * Desktop (lg+): controls on the left, previews / manual crop / A4 sheet on the right,
 * each column scrolling on its own.
 */
export default function CardTool({ crop }: CardToolProps) {
  const { tool, view, phase, notice, result, pages, processor, open, close } =
    crop;
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const busy = phase === "processing";
  const hasPages = pages.length > 0;

  // Close on Escape, lock page scroll behind the window, move focus into it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  if (!open) return null;

  const frontImage =
    result ? { base: result.front, adjustments: crop.adjustments.front } : null;
  const backImage =
    result && result.back ?
      { base: result.back, adjustments: crop.adjustments.back }
    : null;
  const exportBusy = crop.exporting !== null;

  return (
    <div
      className="cc-overlay fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}>
      <div className="cc-modal-bg flex h-full w-full max-w-350 flex-col overflow-hidden sm:rounded-3xl sm:shadow-2xl">
        <header className="cc-modal-header flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <span
            aria-hidden="true"
            className={`cc-tile h-10 w-10 text-sm sm:h-11 sm:w-11 ${tool ? `cc-tone-${tool.tone}` : "cc-tone-slate"}`}>
            {tool ? tool.icon : "A4"}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="truncate text-base font-extrabold sm:text-xl">
              {tool ? tool.windowTitle : "Multi-ID A4 • A4 Card Position"}
            </h2>
            <p className="cc-muted hidden text-[11px] font-semibold sm:block">
              Browser-only processing • PVC 85.60 × 53.98 mm
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="cc-btn cc-btn-icon">
            ×
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-5 lg:grid lg:grid-cols-[360px_1fr] lg:gap-5 lg:overflow-hidden">
          {/* `contents` on small screens lets the two blocks be re-ordered around the results. */}
          <aside className="contents lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:overflow-y-auto">
            <div className="cc-card order-1 space-y-3 p-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold">
                <span
                  className="h-4 w-1 rounded"
                  style={{ background: "var(--cc-accent)" }}
                  aria-hidden="true"
                />
                {tool ? `${tool.shortLabel} Controls` : "A4 Sheet Controls"}
              </h3>

              {tool ?
                <>
                  <p className="cc-notice cc-notice-success">
                    {tool.securityNote}
                  </p>

                  <FileUploader
                    tool={tool}
                    busy={busy}
                    disabled={busy}
                    hasFile={hasPages}
                    onFile={(file) => void crop.handleFile(file)}
                  />

                  {processor.needsPassword ?
                    <PasswordForm
                      wrong={processor.wrongPassword}
                      busy={busy}
                      onSubmit={(password) =>
                        void crop.submitPassword(password)
                      }
                    />
                  : null}

                  {processor.error ?
                    <p
                      role="alert"
                      className="cc-notice cc-notice-error">
                      {processor.error.message}
                    </p>
                  : null}
                </>
              : <p className="cc-inset cc-muted p-3 text-xs leading-relaxed">
                  Cards added with “Add More to A4” appear on the sheet. Close
                  this window and pick a tool to add another card.
                </p>
              }

              {notice ?
                <p
                  role={notice.kind === "error" ? "alert" : "status"}
                  className={`cc-notice ${NOTICE_CLASS[notice.kind]}`}>
                  {notice.text}
                </p>
              : null}

              {tool ?
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void crop.autoCrop()}
                    disabled={!hasPages || busy}
                    className="cc-btn cc-btn-primary">
                    Auto Crop
                  </button>
                  <button
                    type="button"
                    onClick={crop.startManual}
                    disabled={!hasPages || busy}
                    className="cc-btn">
                    Manual Crop
                  </button>
                </div>
              : null}
            </div>

            <div className="order-3 space-y-4">
              <OutputSettings
                dpi={crop.dpi}
                onChange={crop.setDpi}
              />
              <DownloadOptions
                hasResult={result !== null}
                basketCount={crop.basket.length}
                canAddToA4={crop.canAddToA4}
                sheetPairCount={crop.layoutPairs.length}
                exporting={crop.exporting}
                error={crop.exportError}
                onDownloadBoth={() => void crop.exportBoth()}
                onAddToA4={crop.addToA4}
                onA4Jpeg={() => void crop.exportA4Jpeg()}
                onA4Pdf={() => void crop.exportA4Pdf()}
                on4x6={() => void crop.export4x6()}
                onOpenA4Layout={() => crop.setView("a4")}
              />
            </div>
          </aside>

          <main
            className="order-2 min-w-0 space-y-4 lg:min-h-0 lg:overflow-y-auto"
            aria-busy={busy}>
            {busy ?
              <p
                role="status"
                className="cc-notice cc-notice-info">
                Processing in your browser…
              </p>
            : null}

            {view === "manual" && hasPages ?
              <CropEditor
                key={pages[0].id}
                pages={pages}
                initial={crop.manualStart}
                aspect={tool?.manualAspect ?? PVC_ASPECT}
                busy={busy}
                canCancel={result !== null}
                onApply={(front, back) => void crop.applyManual(front, back)}
                onCancel={crop.cancelManual}
              />
            : null}

            {view === "a4" ?
              <>
                {tool && result ?
                  <button
                    type="button"
                    onClick={() => crop.setView("result")}
                    className="cc-btn">
                    ← Back to Front / Back preview
                  </button>
                : null}
                <A4Canvas
                  pairs={crop.layoutPairs}
                  onMove={crop.moveCard}
                  onReset={crop.resetLayout}
                  onRemove={crop.removePair}
                />
              </>
            : null}

            {view === "result" ?
              frontImage ?
                <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
                  <CardPreview
                    title="Front Side"
                    downloadLabel="Download Front JPG"
                    image={frontImage}
                    busy={exportBusy}
                    onChange={(key, value) =>
                      crop.setAdjustment("front", key, value)
                    }
                    onReset={() => crop.resetAdjustments("front")}
                    onDownload={() => void crop.exportFront()}
                  />
                  {backImage ?
                    <CardPreview
                      title="Back Side"
                      downloadLabel="Download Back JPG"
                      image={backImage}
                      busy={exportBusy}
                      onChange={(key, value) =>
                        crop.setAdjustment("back", key, value)
                      }
                      onReset={() => crop.resetAdjustments("back")}
                      onDownload={() => void crop.exportBack()}
                    />
                  : null}
                </div>
              : <div className="cc-card cc-muted flex min-h-40 items-center justify-center p-8 text-center text-sm">
                  Select a file to see the Front and Back previews here.
                </div>

            : null}
          </main>
        </div>

        {/* Phones: keep the two most-used downloads within thumb reach. */}
        {result && view === "result" ?
          <div className="cc-bar flex gap-2 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
            <button
              type="button"
              className="cc-btn flex-1"
              disabled={exportBusy}
              onClick={() => void crop.exportBoth()}>
              {crop.exporting === "both" ? "Preparing…" : "Download Both"}
            </button>
            <button
              type="button"
              className="cc-btn cc-btn-primary flex-1"
              disabled={exportBusy || crop.layoutPairs.length === 0}
              onClick={() => void crop.exportA4Jpeg()}>
              {crop.exporting === "a4" ? "Preparing…" : "A4 Printable"}
            </button>
          </div>
        : null}
      </div>
    </div>
  );
}
