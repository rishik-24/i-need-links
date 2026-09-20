"use client";

import { useRef } from "react";
import type { GovernmentCategoryInfo } from "@/lib/government-data";

interface CategoryFilterProps {
  categories: GovernmentCategoryInfo[];
  activeCategory: string;
  onChange: (category: string) => void;
}

const categoryStyles: Record<
  string,
  {
    active: string;
    icon: string;
  }
> = {
  citizen: {
    active:
      "border-orange-500 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20",
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  },

  education: {
    active:
      "border-violet-500 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20",
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  },

  land: {
    active:
      "border-emerald-500 bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },

  vehicle: {
    active:
      "border-blue-500 bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/20",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },

  jobs: {
    active:
      "border-pink-500 bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20",
    icon: "bg-pink-100 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400",
  },

  health: {
    active:
      "border-teal-500 bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20",
    icon: "bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  },

  business: {
    active:
      "border-indigo-500 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/20",
    icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
};

export function CategoryFilter({
  categories,
  activeCategory,
  onChange,
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollRef.current;

    if (!container) return;

    if (
      container.scrollWidth > container.clientWidth &&
      Math.abs(event.deltaY) > Math.abs(event.deltaX)
    ) {
      event.preventDefault();

      container.scrollBy({
        left: event.deltaY,
        behavior: "auto",
      });
    }
  };

  return (
    <div className="w-full min-w-0">
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex w-full min-w-0 touch-pan-x scrollbar-none gap-3 overflow-x-auto overscroll-x-contain pt-1 pb-3 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* All */}
        <button
          type="button"
          onClick={() => onChange("all")}
          aria-pressed={activeCategory === "all"}
          className={`flex min-w-30 shrink-0 flex-col items-start justify-between rounded-2xl border p-3 text-left transition-all duration-200 ${
            activeCategory === "all" ?
              "border-orange-500 bg-linear-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20"
            : "border-border bg-card hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          } `}>
          <span
            className={`mb-3 flex size-9 items-center justify-center rounded-xl ${
              activeCategory === "all" ? "bg-white/20" : (
                "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
              )
            }`}>
            ✨
          </span>

          <span className="text-sm font-bold">সব পরিষেবা</span>

          <span
            className={`mt-0.5 text-[11px] ${
              activeCategory === "all" ? "text-white/80" : (
                "text-muted-foreground"
              )
            }`}>
            All Portals
          </span>
        </button>

        {categories.map((category) => {
          const active = activeCategory === category.id;

          const style = categoryStyles[category.id] ?? {
            active:
              "border-primary bg-primary text-primary-foreground shadow-lg",
            icon: "bg-primary/10 text-primary",
          };

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              aria-pressed={active}
              className={`flex min-w-37.5 shrink-0 flex-col items-start justify-between rounded-2xl border p-3 text-left transition-all duration-200 ${
                active ?
                  style.active
                : "border-border bg-card hover:-translate-y-0.5 hover:shadow-md"
              } `}>
              <span
                className={`mb-3 flex size-9 items-center justify-center rounded-xl text-base ${
                  active ? "bg-white/20" : style.icon
                }`}>
                {category.icon}
              </span>

              <span className="max-w-full truncate text-sm font-bold">
                {category.title}
              </span>

              <span
                className={`mt-0.5 max-w-full truncate text-[11px] ${
                  active ? "text-white/80" : "text-muted-foreground"
                }`}>
                {category.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
