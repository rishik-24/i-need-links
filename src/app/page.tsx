import type { Metadata } from "next";
import HomePage from "@/components/Home/HomePage";

export const metadata: Metadata = {
  title: "Open Concept Bangla",
  description:
    "Government portals, useful digital resources and browser-based card tools for everyday users.",
};

export default function Page() {
  return <HomePage />;
}
