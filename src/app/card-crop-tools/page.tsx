import CardToolSelector from "@/components/CardCrop/CardToolSelector";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Card Crop Tools • Ration, Voter, PAN, Aadhaar, Ayushman",
  description:
    "Crop ID cards from PDF or image to exact PVC size (85.60 × 53.98 mm) at 300/600 DPI. Everything runs in your browser.",
};

export default function CardCropToolsPage() {
  return <CardToolSelector />;
}
