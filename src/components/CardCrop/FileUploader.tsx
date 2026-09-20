"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import type { CardToolConfig } from "@/lib/card-crop/card-tools";

interface FileUploaderProps {
  tool: CardToolConfig;
  disabled?: boolean;
  busy?: boolean;
  /** Label shown once a file has been processed. */
  hasFile?: boolean;
  onFile: (file: File) => void;
}

/**
 * Click / drag-and-drop file picker. Real validation (magic bytes, size,
 * page count) happens in `loadSourceFile`; the `accept` attribute is only a hint.
 */
export default function FileUploader({ tool, disabled, busy, hasFile, onFile }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const openPicker = (): void => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow selecting the same file again
    if (file) onFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={tool.uploadTitle}
      onClick={openPicker}
      onKeyDown={handleKey}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      data-dragging={dragging}
      className={[
        "cc-drop flex cursor-pointer flex-col items-center justify-center px-4 py-7 text-center sm:py-8",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept={tool.inputAccept}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="cc-accent-text mb-2 h-9 w-9 opacity-70"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M7 3h7l5 5v13H7z" strokeLinejoin="round" />
        <path d="M14 3v5h5M10 13h6M10 17h6" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-bold">
        {busy ? "Processing…" : hasFile ? `Select Another ${tool.acceptLabel.split(" ")[0]}` : tool.uploadTitle}
      </p>
      <p className="cc-muted mt-1 text-xs">{tool.uploadHint}</p>
    </div>
  );
}
