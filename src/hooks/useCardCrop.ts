"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePdfProcessor } from "./usePdfProcessor";
import {
  ADJUSTMENT_RANGES,
  DEFAULT_ADJUSTMENTS,
} from "@/lib/card-crop/adjustments";
import type { AdjustmentKey, Adjustments } from "@/lib/card-crop/adjustments";
import { CARD_TOOLS, getCardTool } from "@/lib/card-crop/card-tools";
import type { CardToolConfig, CardToolId } from "@/lib/card-crop/card-tools";
import { detectCards, suggestManualCrop } from "@/lib/card-crop/detection";
import type { Placement } from "@/lib/card-crop/detection";
import {
  download4x6,
  downloadA4Jpeg,
  downloadA4Pdf,
  downloadBack,
  downloadBoth,
  downloadFront,
} from "@/lib/card-crop/exports";
import type { CardImage, SheetItem } from "@/lib/card-crop/exports";
import { renderCardBase } from "@/lib/card-crop/pdf";
import type { PageSource } from "@/lib/card-crop/pdf";
import {
  MAX_A4_PAIRS,
  clampCardPosition,
  defaultA4PairPositions,
} from "@/lib/card-crop/resize";
import type { Dpi } from "@/lib/card-crop/resize";
import {
  clamp,
  fileBaseName,
  toCardCropError,
  uid,
} from "@/lib/card-crop/utils";
import type { Point } from "@/lib/card-crop/utils";

export type CardSide = "front" | "back";
export type CropView = "result" | "manual" | "a4";
export type Phase = "idle" | "processing" | "ready";

export interface Notice {
  kind: "success" | "error" | "info";
  text: string;
}

export interface CropPlacements {
  front: Placement;
  back: Placement | null;
}

export interface CurrentResult {
  id: string;
  front: HTMLCanvasElement;
  back: HTMLCanvasElement | null;
  placements: CropPlacements;
}

interface A4Pair {
  id: string;
  label: string;
  front: CardImage;
  back: CardImage | null;
}

/** One front(/back) pair as it appears on the A4 sheet. */
export interface LayoutPair {
  id: string;
  label: string;
  front: CardImage;
  back: CardImage | null;
  frontPos: Point;
  backPos: Point | null;
  isCurrent: boolean;
}

export const positionKey = (pairId: string, side: CardSide): string =>
  `${pairId}:${side}`;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => window.setTimeout(resolve, 0));
  });
}

export function useCardCrop() {
  const processor = usePdfProcessor();
  // The processor object changes every render; its functions are stable.
  const {
    reset: resetProcessor,
    load: loadFile,
    submitPassword: submitFilePassword,
  } = processor;

  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<CardToolConfig | null>(null);
  const [view, setView] = useState<CropView>("result");
  const [phase, setPhase] = useState<Phase>("idle");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sourceName, setSourceName] = useState("card");

  const [result, setResult] = useState<CurrentResult | null>(null);
  const [manualStart, setManualStart] = useState<CropPlacements | null>(null);
  const [adjustments, setAdjustments] = useState<Record<CardSide, Adjustments>>(
    {
      front: DEFAULT_ADJUSTMENTS,
      back: DEFAULT_ADJUSTMENTS,
    },
  );
  const [dpi, setDpi] = useState<Dpi>(300);

  const [basket, setBasket] = useState<A4Pair[]>([]);
  const [positions, setPositions] = useState<Record<string, Point>>({});

  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const job = useRef(0);
  const pages: PageSource[] = useMemo(
    () => processor.document?.pages ?? [],
    [processor.document],
  );

  /* ---------------------------- open / close --------------------------- */

  const resetSession = useCallback(() => {
    job.current += 1;
    resetProcessor();
    setResult(null);
    setManualStart(null);
    setNotice(null);
    setPhase("idle");
    setAdjustments({ front: DEFAULT_ADJUSTMENTS, back: DEFAULT_ADJUSTMENTS });
  }, [resetProcessor]);

  const openTool = useCallback(
    (id: CardToolId) => {
      resetSession();
      setTool(getCardTool(id));
      setView("result");
      setExportError(null);
      setOpen(true);
    },
    [resetSession],
  );

  /** Opens the A4 sheet editor without a specific tool (Multi-ID A4). */
  const openA4Only = useCallback(() => {
    resetSession();
    setTool(null);
    setView("a4");
    setExportError(null);
    setOpen(true);
  }, [resetSession]);

  const close = useCallback(() => {
    resetSession();
    setOpen(false);
    setTool(null);
  }, [resetSession]);

  /* ------------------------------ cropping ----------------------------- */

  const buildResult = useCallback(
    async (
      sourcePages: PageSource[],
      front: Placement,
      back: Placement | null,
      token: number,
      message: string,
    ): Promise<void> => {
      try {
        const frontPage = sourcePages[front.pageIndex];
        if (!frontPage) throw new Error("Front page is missing");
        const frontCanvas = await renderCardBase(frontPage, front.rect);
        let backCanvas: HTMLCanvasElement | null = null;
        if (back) {
          const backPage = sourcePages[back.pageIndex];
          if (!backPage) throw new Error("Back page is missing");
          backCanvas = await renderCardBase(backPage, back.rect);
        }
        if (token !== job.current) return;
        setResult({
          id: uid("pair"),
          front: frontCanvas,
          back: backCanvas,
          placements: { front, back },
        });
        setManualStart({ front, back });
        setAdjustments({
          front: DEFAULT_ADJUSTMENTS,
          back: DEFAULT_ADJUSTMENTS,
        });
        setView("result");
        setNotice({ kind: "success", text: message });
      } catch (error) {
        if (token !== job.current) return;
        setNotice({ kind: "error", text: toCardCropError(error).message });
      } finally {
        if (token === job.current) setPhase("ready");
      }
    },
    [],
  );

  const detectAndBuild = useCallback(
    async (
      activeTool: CardToolConfig,
      sourcePages: PageSource[],
      token: number,
    ) => {
      setPhase("processing");
      setNotice({ kind: "info", text: "Detecting card area…" });
      await nextFrame();
      if (token !== job.current) return;

      let outcome;
      try {
        outcome = detectCards(activeTool.strategy, sourcePages);
      } catch (error) {
        setNotice({ kind: "error", text: toCardCropError(error).message });
        setPhase("ready");
        return;
      }

      if (!outcome.ok) {
        // Detection failed: keep the pages, hand over to Manual Crop.
        const first = sourcePages[0];
        if (first) {
          const rect = suggestManualCrop(first, activeTool.manualAspect);
          setManualStart({
            front: { pageIndex: first.index, rect },
            back: null,
          });
        }
        setResult(null);
        setNotice({ kind: "error", text: outcome.reason });
        setView("manual");
        setPhase("ready");
        return;
      }

      const { front, back } = outcome.cards;
      await buildResult(
        sourcePages,
        front,
        back,
        token,
        back ?
          "Crop complete. Front এবং Back আলাদা PVC-size JPG ready."
        : "Crop complete. PVC-size JPG ready.",
      );
    },
    [buildResult],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!tool) return;
      job.current += 1;
      const token = job.current;
      setResult(null);
      setNotice(null);
      setExportError(null);
      setView("result");
      setPhase("processing");
      setSourceName(fileBaseName(file.name));

      const doc = await loadFile(file, {
        maxBytes: tool.maxBytes,
        accept: tool.accept,
        minPages: tool.minPages,
        maxPages: tool.maxPages,
      });
      if (token !== job.current) return;
      if (!doc) {
        // Error or password prompt: the processor exposes the details.
        setPhase("idle");
        return;
      }
      await detectAndBuild(tool, doc.pages, token);
    },
    [tool, loadFile, detectAndBuild],
  );

  const submitPassword = useCallback(
    async (password: string) => {
      if (!tool) return;
      job.current += 1;
      const token = job.current;
      setPhase("processing");
      const doc = await submitFilePassword(password);
      if (token !== job.current) return;
      if (!doc) {
        setPhase("idle");
        return;
      }
      await detectAndBuild(tool, doc.pages, token);
    },
    [tool, submitFilePassword, detectAndBuild],
  );

  /** "Auto Crop" button: run detection again on the loaded file. */
  const autoCrop = useCallback(async () => {
    if (!tool || pages.length === 0) return;
    job.current += 1;
    await detectAndBuild(tool, pages, job.current);
  }, [tool, pages, detectAndBuild]);

  const startManual = useCallback(() => {
    if (pages.length === 0) return;
    setView("manual");
  }, [pages.length]);

  const cancelManual = useCallback(() => {
    setView("result");
  }, []);

  const applyManual = useCallback(
    async (front: Placement, back: Placement | null) => {
      job.current += 1;
      const token = job.current;
      setPhase("processing");
      setNotice({ kind: "info", text: "Applying crop…" });
      await nextFrame();
      await buildResult(
        pages,
        front,
        back,
        token,
        back ?
          "Manual crop applied. Front এবং Back PVC-size JPG ready."
        : "Manual crop applied.",
      );
    },
    [pages, buildResult],
  );

  /* ----------------------------- adjustments --------------------------- */

  const setAdjustment = useCallback(
    (side: CardSide, key: AdjustmentKey, value: number) => {
      const range = ADJUSTMENT_RANGES[key];
      setAdjustments((prev) => ({
        ...prev,
        [side]: {
          ...prev[side],
          [key]: clamp(Math.round(value), range.min, range.max),
        },
      }));
    },
    [],
  );

  const resetAdjustments = useCallback((side: CardSide) => {
    setAdjustments((prev) => ({ ...prev, [side]: DEFAULT_ADJUSTMENTS }));
  }, []);

  /* ------------------------------ A4 sheet ----------------------------- */

  const layoutPairs: LayoutPair[] = useMemo(() => {
    const entries: Array<Omit<LayoutPair, "frontPos" | "backPos">> = basket.map(
      (pair) => ({
        ...pair,
        isCurrent: false,
      }),
    );
    if (result && basket.length < MAX_A4_PAIRS) {
      entries.push({
        id: result.id,
        label: tool ? `${tool.shortLabel} (current)` : "Current",
        front: { base: result.front, adjustments: adjustments.front },
        back:
          result.back ?
            { base: result.back, adjustments: adjustments.back }
          : null,
        isCurrent: true,
      });
    }
    return entries.map((entry, index) => {
      const defaults = defaultA4PairPositions(index, entry.back !== null);
      return {
        ...entry,
        frontPos: positions[positionKey(entry.id, "front")] ?? defaults.front,
        backPos:
          entry.back ?
            (positions[positionKey(entry.id, "back")] ??
            defaults.back ??
            defaults.front)
          : null,
      };
    });
  }, [basket, result, tool, adjustments, positions]);

  const sheetItems: SheetItem[] = useMemo(
    () =>
      layoutPairs.flatMap((pair) => {
        const items: SheetItem[] = [
          { image: pair.front, xMm: pair.frontPos.x, yMm: pair.frontPos.y },
        ];
        if (pair.back && pair.backPos) {
          items.push({
            image: pair.back,
            xMm: pair.backPos.x,
            yMm: pair.backPos.y,
          });
        }
        return items;
      }),
    [layoutPairs],
  );

  const moveCard = useCallback(
    (pairId: string, side: CardSide, point: Point) => {
      setPositions((prev) => ({
        ...prev,
        [positionKey(pairId, side)]: clampCardPosition(point),
      }));
    },
    [],
  );

  const resetLayout = useCallback(() => setPositions({}), []);

  const removePair = useCallback((pairId: string) => {
    setBasket((prev) => prev.filter((pair) => pair.id !== pairId));
    setPositions((prev) => {
      const next = { ...prev };
      delete next[positionKey(pairId, "front")];
      delete next[positionKey(pairId, "back")];
      return next;
    });
  }, []);

  const canAddToA4 = result !== null && basket.length < MAX_A4_PAIRS;

  /** "Add More to A4": stores the current pair on the sheet and clears the tool for the next PDF. */
  const addToA4 = useCallback(() => {
    if (!result || basket.length >= MAX_A4_PAIRS) return;
    const current = layoutPairs.find((pair) => pair.id === result.id);
    const label = `${tool?.shortLabel ?? "Card"} ${basket.length + 1}`;
    setBasket((prev) => [
      ...prev,
      {
        id: result.id,
        label,
        front: { base: result.front, adjustments: adjustments.front },
        back:
          result.back ?
            { base: result.back, adjustments: adjustments.back }
          : null,
      },
    ]);
    if (current) {
      // Pin the position so later removals do not move this pair.
      setPositions((prev) => ({
        ...prev,
        [positionKey(result.id, "front")]: current.frontPos,
        ...(current.backPos ?
          { [positionKey(result.id, "back")]: current.backPos }
        : {}),
      }));
    }
    const count = basket.length + 1;
    resetSession();
    setNotice({
      kind: "success",
      text:
        count >= MAX_A4_PAIRS ?
          `Added to A4 (${count}/${MAX_A4_PAIRS}). The A4 sheet is full.`
        : `Added to A4 (${count}/${MAX_A4_PAIRS}). Select the next file to add another card.`,
    });
  }, [result, basket.length, layoutPairs, tool, adjustments, resetSession]);

  /* ------------------------------- exports ----------------------------- */

  const runExport = useCallback(
    async (label: string, work: () => Promise<void>) => {
      setExporting(label);
      setExportError(null);
      try {
        await nextFrame();
        await work();
      } catch (error) {
        setExportError(toCardCropError(error).message);
      } finally {
        setExporting(null);
      }
    },
    [],
  );

  const frontImage: CardImage | null =
    result ? { base: result.front, adjustments: adjustments.front } : null;
  const backImage: CardImage | null =
    result && result.back ?
      { base: result.back, adjustments: adjustments.back }
    : null;

  const exportFront = useCallback(
    () =>
      frontImage ?
        runExport("front", () => downloadFront(frontImage, sourceName))
      : undefined,
    [frontImage, runExport, sourceName],
  );
  const exportBack = useCallback(
    () =>
      backImage ?
        runExport("back", () => downloadBack(backImage, sourceName))
      : undefined,
    [backImage, runExport, sourceName],
  );
  const exportBoth = useCallback(
    () =>
      frontImage ?
        runExport("both", () => downloadBoth(frontImage, backImage, sourceName))
      : undefined,
    [frontImage, backImage, runExport, sourceName],
  );
  const exportA4Jpeg = useCallback(
    () =>
      sheetItems.length > 0 ?
        runExport("a4", () =>
          downloadA4Jpeg(
            sheetItems,
            dpi,
            sourceName === "card" ? "cards" : sourceName,
          ),
        )
      : undefined,
    [sheetItems, dpi, runExport, sourceName],
  );
  const exportA4Pdf = useCallback(
    () =>
      sheetItems.length > 0 ?
        runExport("a4pdf", () =>
          downloadA4Pdf(
            sheetItems,
            dpi,
            sourceName === "card" ? "cards" : sourceName,
          ),
        )
      : undefined,
    [sheetItems, dpi, runExport, sourceName],
  );
  const export4x6 = useCallback(
    () =>
      frontImage ?
        runExport("4x6", () =>
          download4x6(
            backImage ? [frontImage, backImage] : [frontImage],
            dpi,
            sourceName,
          ),
        )
      : undefined,
    [frontImage, backImage, dpi, runExport, sourceName],
  );

  return {
    tools: CARD_TOOLS,
    processor,
    open,
    tool,
    view,
    setView,
    phase,
    notice,
    pages,
    result,
    manualStart,
    adjustments,
    dpi,
    setDpi,
    basket,
    layoutPairs,
    sheetItems,
    canAddToA4,
    exporting,
    exportError,
    openTool,
    openA4Only,
    close,
    handleFile,
    submitPassword,
    autoCrop,
    startManual,
    cancelManual,
    applyManual,
    setAdjustment,
    resetAdjustments,
    moveCard,
    resetLayout,
    removePair,
    addToA4,
    exportFront,
    exportBack,
    exportBoth,
    exportA4Jpeg,
    exportA4Pdf,
    export4x6,
  };
}

export type CardCropController = ReturnType<typeof useCardCrop>;
