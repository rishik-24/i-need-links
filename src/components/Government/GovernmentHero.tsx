import {
  ArrowRight,
  CheckCircle2,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function GovernmentHero() {
  return (
    <section className="dark:via-background relative isolate overflow-hidden rounded-4xl border border-orange-200/60 bg-linear-to-br from-orange-50 via-white to-blue-50 px-5 py-8 shadow-sm sm:px-10 sm:py-12 lg:px-14 lg:py-14 dark:border-orange-500/10 dark:from-orange-950/30 dark:to-blue-950/20">
      {/* Decorative gradients */}
      <div className="pointer-events-none absolute -top-32 -right-32 -z-10 size-80 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/10" />

      <div className="pointer-events-none absolute -bottom-32 -left-32 -z-10 size-80 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-500/10" />

      <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left */}
        <div>
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-[0.16em] text-orange-600 uppercase shadow-sm backdrop-blur dark:border-orange-500/20 dark:bg-white/5 dark:text-orange-400">
            <span className="flex size-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/10">
              🏛️
            </span>
            Government Services
          </div>

          {/* Heading */}
          <h1 className="max-w-3xl text-4xl leading-[1.12] font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
            প্রয়োজনীয় সরকারি
            <span className="block bg-linear-to-r from-orange-500 via-red-500 to-blue-600 bg-clip-text pt-4 text-transparent">
              ওয়েবসাইট
            </span>
          </h1>

          <p className="mt-4 text-lg font-semibold text-slate-600 sm:text-xl dark:text-slate-300">
            Essential Government Websites
          </p>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-400">
            Cyber Cafe ও সাধারণ ব্যবহারকারীদের জন্য দরকারি সরকারি portal এখন
            category অনুযায়ী সাজানো। সহজে খুঁজুন, official website-এ সরাসরি যান
            এবং সময় বাঁচান।
          </p>

          {/* Features */}
          <div className="mt-7 flex flex-wrap gap-3">
            <Feature
              icon={<CheckCircle2 className="size-4" />}
              title="Trusted Links"
              text="Official Websites"
            />

            <Feature
              icon={<ShieldCheck className="size-4" />}
              title="Easy Access"
              text="Category Wise"
            />

            <Feature
              icon={<Zap className="size-4" />}
              title="Save Time"
              text="All in One Place"
            />
          </div>
        </div>

        {/* Right visual */}
        <div className="relative hidden min-h-75 lg:block">
          {/* Large circle */}
          <div className="absolute top-1/2 right-0 size-72.5 -translate-y-1/2 rounded-full bg-linear-to-br from-orange-200 via-orange-100 to-blue-100 dark:from-orange-500/20 dark:via-orange-500/10 dark:to-blue-500/10" />

          {/* Building card */}
          <div className="absolute top-1/2 right-8 flex size-61.25 -translate-y-1/2 flex-col items-center justify-center rounded-4xl border border-white/80 bg-white/75 shadow-2xl shadow-slate-300/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <div className="mb-4 flex size-20 items-center justify-center rounded-3xl bg-linear-to-br from-blue-500 to-indigo-600 text-4xl shadow-lg shadow-blue-500/25">
              🏛️
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Government Portals
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                সহজে খুঁজুন • দ্রুত পৌঁছান
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
              <span className="size-2 rounded-full bg-green-500" />
              Verified Links
            </div>
          </div>

          {/* Floating search card */}
          <div className="absolute -bottom-2 left-0 flex items-center gap-3 rounded-2xl border bg-white/90 px-4 py-3 shadow-xl backdrop-blur dark:bg-slate-900/90">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              <Search className="size-4" />
            </div>

            <div>
              <p className="text-xs font-bold">Find a service</p>
              <p className="text-muted-foreground text-[11px]">
                Search 60+ portals
              </p>
            </div>

            <ArrowRight className="ml-2 size-4 text-orange-500" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-3.5 py-2.5 shadow-sm backdrop-blur dark:border-white/5 dark:bg-white/5">
      <div className="flex size-8 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400">
        {icon}
      </div>

      <div>
        <p className="text-xs font-bold">{title}</p>
        <p className="text-muted-foreground text-[11px]">{text}</p>
      </div>
    </div>
  );
}
