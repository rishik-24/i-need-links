import { PVC_ASPECT } from "./resize";
import type { DetectionStrategy } from "./detection";
import type { SniffedKind } from "./utils";

export type CardToolId = "ration" | "pan" | "ayushman" | "voter" | "abc";

/** Pastel colour family of the tool's icon tile (see `.cc-tone-*` in card-crop.css). */
export type CardTone = "orange" | "blue" | "green" | "purple" | "rose" | "slate";

export interface CardToolConfig {
  id: CardToolId;
  /** Heading on the tool card. */
  title: string;
  /** Short name used to label cards on the A4 sheet. */
  shortLabel: string;
  /** One-line description on the tool card. */
  subtitle: string;
  /** Heading of the tool window. */
  windowTitle: string;
  /** Short label / emoji shown inside the coloured icon square. */
  icon: string;
  tone: CardTone;

  accept: readonly SniffedKind[];
  /** Shown in the file picker: e.g. "PDF only". */
  acceptLabel: string;
  /** `accept` attribute of the <input type="file">. */
  inputAccept: string;
  uploadTitle: string;
  uploadHint: string;
  maxBytes: number;

  /** Which detection algorithm to run. */
  strategy: DetectionStrategy;
  /** PDF must have at least this many pages. */
  minPages: number;
  /** Number of pages rendered for detection / manual crop. */
  maxPages: number;
  /** Width / height ratio locked in the manual crop editor. */
  manualAspect: number;
  /** Privacy / accepted-file note shown above the uploader. */
  securityNote: string;
}

const MB = 1024 * 1024;

const BENGALI_PDF_NOTE =
  "🔒 Security: শুধুমাত্র আসল PDF file নেওয়া হবে। JPG/PNG/ZIP/PHP/EXE বা অন্য কোনো file নেওয়া হবে না। PDF-টি আপনার browser-এর মধ্যেই process হবে—website server-এ upload বা save করা হবে না।";

export const CARD_TOOLS: readonly CardToolConfig[] = [
  {
    id: "ration",
    tone: "orange",
    shortLabel: "Ration",
    title: "Ration Card Crop / রেশন কার্ড ক্রপ",
    subtitle: "PDF থেকে Front + Back Auto/Manual Crop • PVC Size",
    windowTitle: "রেশন কার্ড PDF → PVC Auto Crop",
    icon: "✂️",
    accept: ["pdf"],
    acceptLabel: "PDF",
    inputAccept: "application/pdf,.pdf",
    uploadTitle: "Select Ration Card PDF",
    uploadHint: "Only PDF • Maximum 15 MB • First page will be processed",
    maxBytes: 15 * MB,
    strategy: "ration",
    minPages: 1,
    maxPages: 1,
    manualAspect: PVC_ASPECT,
    securityNote: BENGALI_PDF_NOTE,
  },
  {
    id: "pan",
    tone: "blue",
    shortLabel: "PAN/ID",
    title: "PAN/Aadhaar/Others Card Crop",
    subtitle: "PDF / JPG / PNG → Blue PAN Area Auto Crop • PVC Size",
    windowTitle: "PAN / Aadhaar / Others → PVC Auto Crop",
    icon: "PAN",
    accept: ["pdf", "jpeg", "png"],
    acceptLabel: "PDF / JPG / JPEG / PNG",
    inputAccept: "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png",
    uploadTitle: "Select PAN Card PDF / JPG / JPEG / PNG",
    uploadHint: "Maximum 15 MB • Blue PAN area is detected automatically",
    maxBytes: 15 * MB,
    strategy: "pan",
    minPages: 1,
    maxPages: 1,
    manualAspect: PVC_ASPECT,
    securityNote:
      "🔒 Browser-side processing only. The tool detects the large blue/cyan PAN-card region and crops only that card area. Your file is never uploaded.",
  },
  {
    id: "ayushman",
    tone: "rose",
    shortLabel: "Ayushman",
    title: "Ayushman Card Crop / আয়ুষ্মান কার্ড ক্রপ",
    subtitle: "2 Page PDF → Front + Back Auto PVC Fit",
    windowTitle: "আয়ুষ্মান কার্ড PDF → PVC Auto Fit",
    icon: "🪪",
    accept: ["pdf"],
    acceptLabel: "PDF",
    inputAccept: "application/pdf,.pdf",
    uploadTitle: "Select Ayushman Card PDF",
    uploadHint: "2-page PDF • Page 1 = Front, Page 2 = Back • Maximum 15 MB",
    maxBytes: 15 * MB,
    strategy: "ayushman",
    minPages: 2,
    maxPages: 2,
    manualAspect: PVC_ASPECT,
    securityNote: BENGALI_PDF_NOTE,
  },
  {
    id: "voter",
    tone: "green",
    shortLabel: "Voter",
    title: "Voter Card Crop / ভোটার কার্ড ক্রপ",
    subtitle: "Voter PDF → Front + Back Auto Crop • PVC Size",
    windowTitle: "ভোটার কার্ড PDF → PVC Auto Crop",
    icon: "🗳️",
    accept: ["pdf"],
    acceptLabel: "PDF",
    inputAccept: "application/pdf,.pdf",
    uploadTitle: "Select Voter Card (e-EPIC) PDF",
    uploadHint: "Only PDF • Maximum 15 MB • Black border/background is removed",
    maxBytes: 15 * MB,
    strategy: "voter",
    minPages: 1,
    maxPages: 2,
    manualAspect: PVC_ASPECT,
    securityNote: BENGALI_PDF_NOTE,
  },
  {
    id: "abc",
    tone: "purple",
    shortLabel: "ABC",
    title: "ABC / APAAR ID Crop",
    subtitle: "ABC / APAAR PDF → Front Auto Crop • 300 / 600 DPI",
    windowTitle: "ABC / APAAR ID → PVC Auto Crop",
    icon: "ABC",
    accept: ["pdf", "jpeg", "png"],
    acceptLabel: "PDF / JPG / JPEG / PNG",
    inputAccept: "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png",
    uploadTitle: "Select ABC / APAAR PDF or image",
    uploadHint: "PDF / JPG / PNG • Maximum 15 MB • Upper card section is detected",
    maxBytes: 15 * MB,
    strategy: "abc",
    minPages: 1,
    maxPages: 1,
    manualAspect: PVC_ASPECT,
    securityNote:
      "🔒 Browser-side processing only. Your file is never uploaded or saved on any server.",
  },
];

export function getCardTool(id: CardToolId): CardToolConfig {
  const tool = CARD_TOOLS.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown card tool: ${id}`);
  return tool;
}
