import { Globe2, LayoutGrid, LockKeyhole, Smartphone } from "lucide-react";

const benefits = [
  {
    icon: LayoutGrid,
    title: "Organized",
    bengali: "সাজানো ও সহজ",
    description:
      "Useful government portals and digital tools are grouped so you can reach them faster.",
  },
  {
    icon: Smartphone,
    title: "Responsive",
    bengali: "সব ডিভাইসে",
    description:
      "Designed to remain comfortable to use across mobile, tablet and desktop screens.",
  },
  {
    icon: Globe2,
    title: "Browser Based",
    bengali: "ব্রাউজারেই ব্যবহার",
    description:
      "Access the website directly without installing another desktop application.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy Minded",
    bengali: "প্রাইভেসিকে গুরুত্ব",
    description:
      "Where supported, file-processing tools are designed to work locally in your browser.",
  },
];

export default function WhyINeedLinks() {
  return (
    <section className="py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-primary text-sm font-bold">WHY I NEED LINKS?</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Simple tools.
            <span className="text-primary block">Useful access.</span>
          </h2>
          <p className="text-muted-foreground mt-5 max-w-md text-sm leading-7 sm:text-base">
            একটি Clean এবং Practical digital space, যেখানে দরকারি links ও
            browser-based tools দ্রুত খুঁজে পাওয়া যায়।
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="border-border/70 bg-card rounded-2xl border p-5 shadow-sm">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-bold">{benefit.title}</h3>
                <p className="text-primary mt-1 text-xs font-semibold">
                  {benefit.bengali}
                </p>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
