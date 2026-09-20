"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadSourceFile } from "@/lib/card-crop/pdf";
import type { LoadOptions, LoadedDocument } from "@/lib/card-crop/pdf";
import { toCardCropError } from "@/lib/card-crop/utils";
import type { CardCropError } from "@/lib/card-crop/utils";

export type PdfProcessorStatus =
  "idle" | "loading" | "ready" | "password" | "error";

export interface PdfProcessor {
  status: PdfProcessorStatus;
  error: CardCropError | null;
  document: LoadedDocument | null;
  /** True while a password-protected PDF is waiting for its password. */
  needsPassword: boolean;
  wrongPassword: boolean;
  load: (file: File, options: LoadOptions) => Promise<LoadedDocument | null>;
  submitPassword: (password: string) => Promise<LoadedDocument | null>;
  reset: () => void;
}

/**
 * Loads a PDF / image file in the browser and keeps the rendered pages.
 * Handles stale requests (a newer file selection wins) and disposes pdf.js
 * resources when the file is replaced or the component unmounts.
 */
export function usePdfProcessor(): PdfProcessor {
  const [status, setStatus] = useState<PdfProcessorStatus>("idle");
  const [error, setError] = useState<CardCropError | null>(null);
  const [document, setDocument] = useState<LoadedDocument | null>(null);
  const [wrongPassword, setWrongPassword] = useState(false);

  const requestId = useRef(0);
  const currentDoc = useRef<LoadedDocument | null>(null);
  const pending = useRef<{ file: File; options: LoadOptions } | null>(null);

  const disposeCurrent = useCallback(() => {
    currentDoc.current?.dispose();
    currentDoc.current = null;
  }, []);

  const run = useCallback(
    async (
      file: File,
      options: LoadOptions,
    ): Promise<LoadedDocument | null> => {
      requestId.current += 1;
      const id = requestId.current;
      disposeCurrent();
      setDocument(null);
      setError(null);
      setStatus("loading");

      try {
        const loaded = await loadSourceFile(file, options);
        if (id !== requestId.current) {
          loaded.dispose();
          return null;
        }
        currentDoc.current = loaded;
        pending.current = null;
        setWrongPassword(false);
        setDocument(loaded);
        setStatus("ready");
        return loaded;
      } catch (raw) {
        if (id !== requestId.current) return null;
        const failure = toCardCropError(raw);
        if (
          failure.code === "PASSWORD_REQUIRED" ||
          failure.code === "WRONG_PASSWORD"
        ) {
          pending.current = { file, options };
          setWrongPassword(failure.code === "WRONG_PASSWORD");
          setStatus("password");
          setError(null);
          return null;
        }
        pending.current = null;
        setError(failure);
        setStatus("error");
        return null;
      }
    },
    [disposeCurrent],
  );

  const load = useCallback(
    (file: File, options: LoadOptions) => {
      setWrongPassword(false);
      return run(file, options);
    },
    [run],
  );

  const submitPassword = useCallback(
    async (password: string) => {
      const request = pending.current;
      if (!request) return null;
      return run(request.file, { ...request.options, password });
    },
    [run],
  );

  const reset = useCallback(() => {
    requestId.current += 1;
    pending.current = null;
    disposeCurrent();
    setDocument(null);
    setError(null);
    setWrongPassword(false);
    setStatus("idle");
  }, [disposeCurrent]);

  useEffect(
    () => () => {
      requestId.current += 1;
      currentDoc.current?.dispose();
      currentDoc.current = null;
    },
    [],
  );

  return {
    status,
    error,
    document,
    needsPassword: status === "password",
    wrongPassword,
    load,
    submitPassword,
    reset,
  };
}
