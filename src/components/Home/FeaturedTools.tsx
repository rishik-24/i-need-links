import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  FileBadge,
  FileImage,
  IdCard,
} from "lucide-react";

const tools = [
  {
    title: "Ration Card",
    bengali: "রেশন কার্ড",
    description:
      "PDF থেকে Front + Back card crop করে PVC-ready output তৈরি করুন.",
    icon: FileImage,
    tone: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    title: "Voter ID",
    bengali: "ভোটার কার্ড",
    description:
      "e-EPIC document থেকে card sides প্রস্তুত করার জন্য smart crop workflow.",
    icon: IdCard,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "PAN Card",
    bengali: "প্যান কার্ড",
    description:
      "Image বা PDF থেকে card area detect করে printable output তৈরি করুন.",
    icon: CreditCard,
    tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Ayushman / ABC",
    bengali: "আয়ুষ্মান / ABC",
    description:
      "Common document formats থেকে card-ready crop workflow ব্যবহার করুন.",
    icon: FileBadge,
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

export default function FeaturedTools() {
  return (
    <section className="border-border/70 bg-muted/35 rounded-4xl border px-5 py-12 sm:px-8 sm:py-14 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-bold">SMART TOOLS</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Card Crop Tools
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            Common ID-card documents-এর জন্য automatic এবং manual crop workflow
            এক জায়গায়।
          </p>
        </div>

        <Link
          href="/card-crop-tools"
          className="text-primary inline-flex w-fit items-center gap-2 text-sm font-bold hover:underline">
          View all tools
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon;

          return (
            <Link
              key={tool.title}
              href="/card-crop-tools"
              className="group border-border/70 bg-card hover:border-primary/30 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span
                className={`flex size-11 items-center justify-center rounded-xl ${tool.tone}`}>
                <Icon className="size-5" />
              </span>

              <h3 className="mt-5 text-base font-bold">{tool.title}</h3>
              <p className="text-primary mt-1 text-xs font-semibold">
                {tool.bengali}
              </p>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {tool.description}
              </p>

              <span className="text-foreground mt-5 inline-flex items-center gap-1 text-xs font-bold">
                Open tool
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
