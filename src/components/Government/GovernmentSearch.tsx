"use client";

import { Search } from "lucide-react";

interface GovernmentSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function GovernmentSearch({ value, onChange }: GovernmentSearchProps) {
  return (
    <div className="relative w-full min-w-0">
      <Search className="text-muted-foreground absolute top-1/2 left-4 size-5 -translate-y-1/2" />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search government services..."
        className="border-border bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary/10 h-14 w-full min-w-0 rounded-2xl border pr-4 pl-12 text-sm transition-shadow outline-none focus:ring-4"
      />
    </div>
  );
}
