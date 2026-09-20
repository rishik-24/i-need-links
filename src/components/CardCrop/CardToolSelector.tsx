"use client";

import { useSyncExternalStore } from "react";
import "./card-crop.css";
import CardTool from "./CardTool";
import { useCardCrop } from "@/hooks/useCardCrop";
import { MAX_A4_PAIRS } from "@/lib/card-crop/resize";

/* ------------------------------------------------------------------ */
/* Site theme detection (light / dark)                                 */
/* ------------------------------------------------------------------ */

type SiteTheme = "light" | "dark";

function numbersIn(color: string): number[] {
  return (color.match(/-?\d*\.?\d+(?:e-?\d+)?%?/g) ?? []).map((n) =>
    n.endsWith("%") ? parseFloat(n) / 100 : parseFloat(n),
  );
}

/**
 * Lightness (0..1) of a computed CSS colour, or null when it is transparent /
 * unknown. Handles rgb(), color(srgb …), oklch/oklab (Tailwind v4) and lab/lch.
 */
function lightnessOf(value: string): number | null {
  const color = value.trim().toLowerCase();
  if (!color || color === "transparent") return null;
  const n = numbersIn(color);

  if (color.startsWith("oklch") || color.startsWith("oklab"))
    return n.length >= 1 ? n[0] : null;
  if (color.startsWith("lab") || color.startsWith("lch")) {
    return (
      n.length >= 1 ?
        n[0] > 1 ?
          n[0] / 100
        : n[0]
      : null
    );
  }
  if (color.startsWith("color(")) {
    if (n.length < 3) return null;
    const alpha = n.length >= 4 ? n[3] : 1;
    return alpha === 0 ? null : 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2];
  }
  if (color.startsWith("rgb")) {
    if (n.length < 3) return null;
    const alpha = n.length >= 4 ? n[3] : 1;
    return alpha === 0 ? null : (
        (0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]) / 255
      );
  }
  return null;
}

function readSiteTheme(): SiteTheme {
  const root = document.documentElement;
  const attribute = root.getAttribute("data-theme");
  if (root.classList.contains("dark") || attribute === "dark") return "dark";
  if (root.classList.contains("light") || attribute === "light") return "light";

  for (const element of [document.body, root]) {
    const lightness = lightnessOf(getComputedStyle(element).backgroundColor);
    if (lightness !== null) return lightness < 0.45 ? "dark" : "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ?
      "dark"
    : "light";
}

function subscribeSiteTheme(onChange: () => void): () => void {
  const options = {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"],
  };
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, options);
  observer.observe(document.body, options);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

/** `null` on the server / before hydration: the CSS then follows `html.dark` directly. */
function useSiteTheme(): SiteTheme | null {
  return useSyncExternalStore<SiteTheme | null>(
    subscribeSiteTheme,
    readSiteTheme,
    () => null,
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const isTextIcon = (icon: string): boolean => /^[A-Za-z0-9]+$/.test(icon);

const HIGHLIGHTS = [
  {
    icon: "🔒",
    tone: "green",
    title: "100% Private",
    text: "Browser-only processing",
  },
  { icon: "📐", tone: "blue", title: "PVC Size", text: "85.60 × 53.98 mm" },
  {
    icon: "🖨️",
    tone: "orange",
    title: "300 / 600 DPI",
    text: "A4 & 4×6 print ready",
  },
] as const;

/**
 * Landing screen: hero + the grid of tools. It owns the crop controller so the
 * A4 sheet (Add More to A4) survives when the user switches between tools.
 */
export default function CardToolSelector() {
  const crop = useCardCrop();
  const theme = useSiteTheme();

  return (
    <div
      className="cc-root py-2 sm:py-4"
      data-cc-theme={theme ?? undefined}>
      <section className="cc-hero relative overflow-hidden p-5 sm:p-8 lg:p-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <span className="cc-badge">
              <span
                className="cc-badge-icon"
                aria-hidden="true">
                ✂️
              </span>
              Card Crop Tools
            </span>

            <h1 className="mt-5 text-4xl leading-[1.2] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              স্মার্ট কার্ড
              <span className="cc-headline-accent block">ক্রপ টুল</span>
            </h1>
            <p className="mt-3 text-lg font-bold sm:text-xl">
              Voter, Aadhaar, PAN, Rationx &amp; Ayushman Smart Crop Tool
            </p>
            <p className="cc-muted mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
              Cyber Cafe ও সাধারণ ব্যবহারকারীদের জন্য — PDF বা ছবি upload করুন,
              card নিজে থেকেই detect হয়ে exact PVC size-এ crop হবে। Auto Crop •
              Manual Crop • A4 Free Position — সবকিছু আপনার browser-এই process
              হয়।
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-3 lg:flex lg:flex-wrap">
              {HIGHLIGHTS.map((item) => (
                <li
                  key={item.title}
                  className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-3.5 py-2.5 shadow-sm backdrop-blur dark:border-white/5 dark:bg-white/5">
                  <span
                    aria-hidden="true"
                    className={`cc-tile cc-tone-${item.tone} h-9 w-9 text-base`}>
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold">
                      {item.title}
                    </span>
                    <span className="cc-muted block text-[11px] font-semibold">
                      {item.text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Decorative preview card (desktop only). */}
          <div
            className="relative hidden h-72 lg:block"
            aria-hidden="true">
            <div className="absolute top-1/2 right-0 size-72.5 -translate-y-1/2 rounded-full bg-linear-to-br from-orange-200 via-orange-100 to-blue-100 dark:from-orange-500/20 dark:via-orange-500/10 dark:to-blue-500/10" />
            <div className="absolute top-1/2 right-8 flex size-61.25 -translate-y-1/2 flex-col items-center justify-center rounded-4xl border border-white/80 bg-white/75 shadow-2xl shadow-slate-300/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--cc-accent), var(--cc-accent-2))",
                }}>
                ✂️
              </div>
              <p className="mt-3 text-base font-extrabold">Smart Crop</p>
              <p className="cc-muted text-xs font-semibold">
                সহজে crop • সঠিক PVC size
              </p>
              <p
                className="cc-notice cc-notice-success mt-3 inline-block"
                style={{ borderRadius: 9999, padding: "0.25rem 0.75rem" }}>
                ● Auto + Manual
              </p>
            </div>
            <div className="cc-card absolute -bottom-1 left-0 flex items-center gap-3 px-4 py-3">
              <span className="cc-tile cc-tone-orange h-9 w-9 text-base">
                🔍
              </span>
              <span>
                <span className="block text-xs font-extrabold">
                  Pick a tool
                </span>
                <span className="cc-muted block text-[11px] font-semibold">
                  {crop.tools.length} card types
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mt-8"
        aria-labelledby="cc-tools-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="cc-muted text-xs font-semibold">
              {crop.tools.length} tools available
            </p>
            <h2
              id="cc-tools-heading"
              className="text-2xl font-extrabold sm:text-3xl">
              All Card Crop Tools
            </h2>
          </div>
          <button
            type="button"
            onClick={crop.openA4Only}
            className="cc-btn cc-btn-sm">
            A4 Sheet • {crop.basket.length}/{MAX_A4_PAIRS} added
          </button>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {crop.tools.map((tool) => (
            <li key={tool.id}>
              <button
                type="button"
                onClick={() => crop.openTool(tool.id)}
                className="cc-tool cursor-pointer">
                <span
                  aria-hidden="true"
                  className={`cc-tile cc-tone-${tool.tone} h-12 w-12 sm:h-14 sm:w-14 ${
                    isTextIcon(tool.icon) ? "text-sm" : "text-2xl"
                  }`}>
                  {tool.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug font-extrabold">
                    {tool.title}
                  </span>
                  <span className="cc-muted mt-1 block text-[11px] leading-snug font-semibold">
                    {tool.subtitle}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="cc-arrow">
                  →
                </span>
              </button>
            </li>
          ))}

          <li>
            <button
              type="button"
              onClick={crop.openA4Only}
              className="cc-tool">
              <span
                aria-hidden="true"
                className="cc-tile cc-tone-slate h-12 w-12 text-sm sm:h-14 sm:w-14">
                A4
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-snug font-extrabold">
                  Multi-ID A4 / A4 Card Position
                </span>
                <span className="cc-muted mt-1 block text-[11px] leading-snug font-semibold">
                  Up to {MAX_A4_PAIRS} pairs • Drag cards anywhere •{" "}
                  {crop.basket.length}/{MAX_A4_PAIRS} added
                </span>
              </span>
              <span
                aria-hidden="true"
                className="cc-arrow">
                →
              </span>
            </button>
          </li>
        </ul>
      </section>

      <CardTool crop={crop} />
    </div>
  );
}
