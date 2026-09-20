import Link from "next/link";
import { ArrowUpRight, FileImage, Globe2, Landmark, Link2 } from "lucide-react";
import type { Route } from "next";

const services = [
  {
    title: "Government Services",
    bengali: "সরকারি পরিষেবা",
    description: "Official government portals organized by category.",
    href: "/government",
    icon: Landmark,
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    title: "Card Crop Tools",
    bengali: "কার্ড ক্রপ টুলস",
    description: "Crop and prepare common ID-card documents.",
    href: "/card-crop-tools",
    icon: FileImage,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Useful Resources",
    bengali: "দরকারি রিসোর্স",
    description: "Useful digital resources gathered in one place.",
    href: "/government",
    icon: Globe2,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Important Links",
    bengali: "গুরুত্বপূর্ণ লিঙ্ক",
    description: "Reach frequently used portals without the extra search.",
    href: "/government",
    icon: Link2,
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

export default function QuickServices() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-bold">QUICK ACCESS</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Start with what you need
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            প্রয়োজনীয় ডিজিটাল পরিষেবা এবং টুলস কয়েকটি ক্লিকেই খুঁজে নিন।
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <Link
              key={service.title}
              href={service.href as Route}
              className="group border-border/70 bg-card hover:border-primary/30 rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <span
                  className={`flex size-11 items-center justify-center rounded-xl ${service.className}`}>
                  <Icon className="size-5" />
                </span>
                <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              <h3 className="mt-5 text-base font-bold">{service.title}</h3>
              <p className="text-primary mt-1 text-xs font-semibold">
                {service.bengali}
              </p>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {service.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
