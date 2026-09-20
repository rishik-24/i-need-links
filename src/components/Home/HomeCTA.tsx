import Link from "next/link";
import { ArrowRight, FileImage, Landmark } from "lucide-react";

export default function HomeCTA() {
  return (
    <section className="bg-primary text-primary-foreground relative overflow-hidden rounded-4xl px-5 py-12 sm:px-8 sm:py-14 lg:px-12">
      <div className="absolute -top-24 -right-20 size-64 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-black/10 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-primary-foreground/75 text-sm font-bold">
            READY WHEN YOU ARE
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Find it. Use it. Get it done.
          </h2>
          <p className="text-primary-foreground/80 mt-3 max-w-xl text-sm leading-6 sm:text-base">
            Government portals এবং smart card tools — আপনার পরবর্তী digital
            task-এর জন্য প্রয়োজনীয় জায়গা থেকে শুরু করুন।
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/government"
            className="text-primary inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold shadow-sm transition-transform hover:-translate-y-0.5 dark:bg-black dark:text-white">
            <Landmark className="size-4" />
            Government Portals
          </Link>
          <Link
            href="/card-crop-tools"
            className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15 inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold backdrop-blur transition-colors">
            <FileImage className="size-4" />
            Card Tools
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
