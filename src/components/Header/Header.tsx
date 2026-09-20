"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import ThemeToggleButton from "../ThemeToggleButton";

const navItems = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Government Portals",
    href: "/government",
  },
  {
    name: "Card Crop Tools",
    href: "/card-crop-tools",
  },
] as const;

const Header = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="min-w-0 shrink"
          onClick={() => setOpen(false)}
          aria-label="Open I Need Links Home">
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-xl">
            I Need Links 🔗
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-4 md:flex"
          aria-label="Main navigation">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  active ?
                    "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } `}>
                {item.name}
              </Link>
            );
          })}

          <div className="ml-2">
            <ThemeToggleButton />
          </div>
        </nav>

        {/* Mobile Controls */}
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <ThemeToggleButton />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="bg-background hover:bg-muted flex size-10 items-center justify-center rounded-lg border transition-colors"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation">
            {open ?
              <X className="size-5" />
            : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <div
          id="mobile-navigation"
          className="bg-background border-t md:hidden">
          <nav
            className="mx-auto flex w-full max-w-7xl flex-col px-4 py-3"
            aria-label="Mobile navigation">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    active ?
                      "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                  } `}>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
