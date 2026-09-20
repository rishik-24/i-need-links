import { ExternalLink, ArrowUpRight } from "lucide-react";
import type { GovernmentPortal } from "@/lib/government-data";

interface PortalCardProps {
  portal: GovernmentPortal;
}

const cardColors = [
  "from-blue-500/10 to-indigo-500/10",
  "from-orange-500/10 to-rose-500/10",
  "from-emerald-500/10 to-teal-500/10",
  "from-violet-500/10 to-purple-500/10",
  "from-pink-500/10 to-rose-500/10",
  "from-cyan-500/10 to-blue-500/10",
];

const iconColors = [
  "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  "bg-pink-100 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400",
  "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
];

export function PortalCard({ portal }: PortalCardProps) {
  const colorIndex =
    portal.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    cardColors.length;

  return (
    <a
      href={portal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full">
      <article
        className={`relative flex h-full min-h-58.75 flex-col overflow-hidden rounded-2xl border bg-linear-to-br ${cardColors[colorIndex]} hover:border-primary/20 p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl`}>
        {/* Top gradient glow */}
        <div className="pointer-events-none absolute -top-10 -right-10 size-24 rounded-full bg-white/50 blur-2xl dark:bg-white/5" />

        {/* Top row */}
        <div className="relative flex items-start justify-between">
          <div
            className={`flex size-12 items-center justify-center rounded-2xl text-xl shadow-sm ${iconColors[colorIndex]}`}>
            {portal.icon}
          </div>

          <div className="bg-background/70 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex size-8 items-center justify-center rounded-full border transition-all">
            <ExternalLink className="size-4" />
          </div>
        </div>

        {/* Content */}
        <div className="relative mt-6">
          <h4 className="line-clamp-2 text-xl leading-6 font-bold tracking-tight">
            {portal.name}
          </h4>

          <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-5">
            {portal.description}
          </p>
        </div>

        {/* Bottom */}
        <div className="mt-auto pt-6">
          <div className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5">
            Visit Official Portal
            <ArrowUpRight className="size-4" />
          </div>
        </div>
      </article>
    </a>
  );
}
