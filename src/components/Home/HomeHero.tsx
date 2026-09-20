import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileImage,
  Landmark,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const trustItems = [
  { icon: ShieldCheck, label: "Browser based", detail: "Use tools directly" },
  { icon: Check, label: "Useful links", detail: "Organized in one place" },
  { icon: Sparkles, label: "Bengali friendly", detail: "Simple & accessible" },
];

export default function HomeHero() {
  return (
    <section className="border-border/70 bg-card relative overflow-hidden rounded-4xl border shadow-sm">
      <div className="bg-primary/10 absolute -top-28 -right-28 size-80 rounded-full blur-3xl" />
      <div className="bg-secondary/10 absolute -bottom-32 left-1/3 size-80 rounded-full blur-3xl" />

      <div className="relative grid items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:py-20">
        <div className="max-w-2xl">
          <div className="border-primary/20 bg-primary/10 text-primary mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            বাংলার জন্য দরকারি ডিজিটাল প্ল্যাটফর্ম
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            দরকারি সবকিছু,
            <span className="text-primary mt-1 block">এক জায়গায়।</span>
          </h1>

          <p className="text-muted-foreground mt-5 max-w-xl text-base leading-7 text-pretty sm:text-lg">
            Government portals, useful online resources এবং smart card tools —
            দৈনন্দিন ডিজিটাল কাজকে আরও সহজভাবে খুঁজে পেতে{" "}
            <span className="text-primary font-bold">I Need Links</span> ব্যবহার
            করুন।
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/government"
              className="bg-primary text-primary-foreground inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5">
              Government Portals
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/card-crop-tools"
              className="border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-colors">
              Card Crop Tools
              <FileImage className="size-4" />
            </Link>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {trustItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5">
                  <span className="bg-muted text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-muted-foreground text-[11px]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:pl-4">
          <div className="bg-primary/10 absolute inset-x-10 top-10 h-64 rounded-full blur-3xl" />

          <div className="border-border/70 bg-background/90 relative rounded-[1.75rem] border p-4 shadow-xl backdrop-blur sm:p-5">
            <div className="border-border/70 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
                  <Landmark className="size-5" />
                </div>
                <div>
                  <p className="text-xl font-bold">I Need Links</p>
                  <p className="text-muted-foreground text-xs">
                    Digital access made simpler
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Ready to explore
              </span>
            </div>

            <div className="grid gap-3 pt-4 sm:grid-cols-2">
              <div className="border-border/70 bg-card rounded-2xl border p-4">
                <div className="mb-8 flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Landmark className="size-5" />
                  </span>
                  <ArrowRight className="text-muted-foreground size-4" />
                </div>
                <p className="text-sm font-bold">Government </p>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  Find important official portals by category.
                </p>
              </div>

              <div className="border-border/70 bg-card rounded-2xl border p-4">
                <div className="mb-8 flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <FileImage className="size-5" />
                  </span>
                  <ArrowRight className="text-muted-foreground size-4" />
                </div>
                <p className="text-sm font-bold">Card Crop Tools</p>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  Prepare ID card images and printable outputs.
                </p>
              </div>
            </div>

            <div className="bg-muted/70 mt-3 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold">
                    Quick access
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    Search less. Find faster.
                  </p>
                </div>
                <span className="bg-background flex size-9 items-center justify-center rounded-full shadow-sm">
                  <ArrowRight className="text-primary size-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
