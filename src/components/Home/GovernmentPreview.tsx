import Link from "next/link";
import { ArrowRight, ExternalLink, Landmark } from "lucide-react";
import { governmentPortals } from "@/lib/government-data";

const featuredIds = [
  "uidai",
  "voter",
  "ration",
  "banglarbhumi",
  "parivahan",
  "svmcm",
];

export default function GovernmentPreview() {
  const portals = featuredIds
    .map((id) => governmentPortals.find((portal) => portal.id === id))
    .filter((portal): portal is NonNullable<typeof portal> => Boolean(portal));

  return (
    <section className="py-16 sm:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary">GOVERNMENT PORTALS</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Important portals, organized
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            নাগরিক, শিক্ষা, জমি, চাকরি ও অন্যান্য পরিষেবার দরকারি official
            portals category অনুযায়ী সাজানো।
          </p>
        </div>

        <Link
          href="/government"
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          Browse all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {portals.map((portal) => (
          <a
            key={portal.id}
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-w-0 items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
              {portal.icon}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">
                {portal.name}
              </span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {portal.description}
              </span>
            </span>

            <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </a>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <Landmark className="size-3.5 text-primary" />
        Links open the respective external portal in a new tab.
      </div>
    </section>
  );
}
