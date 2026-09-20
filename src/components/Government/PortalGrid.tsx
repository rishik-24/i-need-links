import type { GovernmentPortal } from "@/lib/government-data";
import { PortalCard } from "./PortalCard";

interface PortalGridProps {
  portals: GovernmentPortal[];
}

export function PortalGrid({ portals }: PortalGridProps) {
  if (portals.length === 0) {
    return (
      <div className="bg-muted/20 rounded-3xl border border-dashed px-6 py-16 text-center">
        <div className="bg-muted mx-auto flex size-14 items-center justify-center rounded-2xl text-2xl">
          🔎
        </div>

        <h3 className="mt-4 text-lg font-bold">No portals found</h3>

        <p className="text-muted-foreground mt-1 text-sm">
          Try another search term or choose a different category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {portals.map((portal) => (
        <PortalCard
          key={portal.id}
          portal={portal}
        />
      ))}
    </div>
  );
}
