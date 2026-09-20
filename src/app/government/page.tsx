"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { CategoryFilter } from "@/components/Government/CategoryFilter";
import { GovernmentHero } from "@/components/Government/GovernmentHero";
import { PortalGrid } from "@/components/Government/PortalGrid";
import { governmentCategories, governmentPortals } from "@/lib/government-data";

export default function GovernmentPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filteredPortals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return governmentPortals.filter((portal) => {
      const matchesCategory =
        category === "all" || portal.category === category;

      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        portal.name.toLowerCase().includes(query) ||
        portal.description.toLowerCase().includes(query)
      );
    });
  }, [search, category]);

  const getCategoryPortals = (categoryId: string) => {
    return filteredPortals.filter((portal) => portal.category === categoryId);
  };

  const isSearching = search.trim().length > 0;

  const activeCategory = governmentCategories.find(
    (item) => item.id === category,
  );

  return (
    <div className="min-w-0">
      {/* Hero */}
      <GovernmentHero />

      {/* Search */}
      <section className="mt-8">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-5 size-5 -translate-y-1/2" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search government services, schemes, portals..."
            className="bg-background placeholder:text-muted-foreground h-14 w-full rounded-2xl border pr-5 pl-14 text-sm shadow-sm transition-all outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="mt-4">
        <CategoryFilter
          categories={governmentCategories}
          activeCategory={category}
          onChange={setCategory}
        />
      </section>

      {/* Results heading */}
      <section className="mt-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">
                {filteredPortals.length} portals available
              </span>

              {search && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
                  Search results
                </span>
              )}
            </div>

            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {category === "all" ?
                "All Government Portals"
              : activeCategory?.title}
            </h2>

            {activeCategory && category !== "all" && (
              <p className="text-muted-foreground mt-1 text-sm">
                {activeCategory.subtitle}
              </p>
            )}
          </div>

          <div className="bg-background text-muted-foreground hidden items-center gap-2 rounded-xl border px-3 py-2 text-sm sm:flex">
            <SlidersHorizontal className="size-4" />
            Category Wise
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mt-6">
        {category === "all" && !isSearching ?
          <div className="space-y-12">
            {governmentCategories.map((categoryInfo) => {
              const portals = getCategoryPortals(categoryInfo.id);

              if (portals.length === 0) {
                return null;
              }

              return (
                <section
                  key={categoryInfo.id}
                  className="bg-card/50 overflow-hidden rounded-[1.75rem] border p-4 shadow-sm sm:p-6">
                  {/* Section heading */}
                  <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="from-primary/15 to-primary/5 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-2xl">
                        {categoryInfo.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black tracking-tight">
                            {categoryInfo.title}
                          </h3>

                          <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[11px] font-semibold">
                            {portals.length} portals
                          </span>
                        </div>

                        <p className="text-muted-foreground mt-1 text-sm font-medium">
                          {categoryInfo.subtitle}
                        </p>

                        <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
                          {categoryInfo.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <PortalGrid portals={portals} />
                </section>
              );
            })}
          </div>
        : <PortalGrid portals={filteredPortals} />}
      </section>

      {/* Bottom note */}
      <section className="dark:via-background mt-12 overflow-hidden rounded-3xl border border-blue-200/60 bg-linear-to-r from-blue-50 via-white to-orange-50 p-6 sm:p-8 dark:border-blue-500/10 dark:from-blue-950/20 dark:to-orange-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl dark:bg-blue-500/10">
            🔗
          </div>

          <div>
            <h3 className="font-bold">Always use official websites</h3>

            <p className="text-muted-foreground mt-1 text-sm leading-6">
              এই তালিকার link-গুলি official portal-এ নিয়ে যায়। গুরুত্বপূর্ণ
              সরকারি কাজ করার আগে website address এবং service details যাচাই করে
              নিন।
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
