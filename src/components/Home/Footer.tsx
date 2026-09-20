import Link from "next/link";
import { ArrowUpRight, FileImage, Landmark } from "lucide-react";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-border/70 bg-muted/30 border-t">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2">
              <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl text-sm font-extrabold">
                INL
              </span>
              <span className="text-base font-extrabold tracking-tight">
                I Need Links
              </span>
            </Link>

            <p className="text-muted-foreground mt-4 text-sm leading-6">
              দরকারি government portals, digital resources এবং browser-based
              tools এক জায়গায় খুঁজে পাওয়ার জন্য একটি simple digital platform।
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold">Quick Links</h3>
            <div className="text-muted-foreground mt-4 grid gap-3 text-sm">
              <Link
                className="hover:text-primary transition-colors"
                href="/">
                Home
              </Link>
              <Link
                className="hover:text-primary transition-colors"
                href="/government">
                Government
              </Link>
              <Link
                className="hover:text-primary transition-colors"
                href="/card-crop-tools">
                Card Crop Tools
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold">Explore</h3>
            <div className="text-muted-foreground mt-4 grid gap-3 text-sm">
              <Link
                className="hover:text-primary inline-flex items-center gap-2 transition-colors"
                href="/government">
                <Landmark className="size-3.5" />
                Government Portals
              </Link>
              <Link
                className="hover:text-primary inline-flex items-center gap-2 transition-colors"
                href="/card-crop-tools">
                <FileImage className="size-3.5" />
                Smart Card Tools
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold">About</h3>
            <p className="text-muted-foreground mt-4 text-sm leading-6">
              Built with a focus on practical access, clean design and
              Bengali-friendly digital experiences.
            </p>
          </div>
        </div>

        <div className="border-border/70 text-muted-foreground mt-10 flex flex-col gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} I Need Links. All rights reserved.</p>
          <Link
            href="/"
            className="hover:text-primary inline-flex items-center gap-1 font-semibold transition-colors">
            Back to top
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
