import { cn } from '@/lib/utils';
import type { RoleLegendSwatch } from './map-role-legend';

export type ConstellationLegendItem = { id: number; name: string; color: string };

export interface MapMarkerLegendProps {
  className?: string;
  constellationItems?: ConstellationLegendItem[];
  /** When true, show role-colour swatches (observed / non-constellation markers). */
  showRoleSwatches: boolean;
  roleSwatches: RoleLegendSwatch[];
  constellationTitle?: string;
  roleSectionTitle?: string;
}

function SwatchRow({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="h-3 w-3 shrink-0 rounded-full border border-border/80 shadow-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </div>
  );
}

export function MapMarkerLegend({
  className,
  constellationItems = [],
  showRoleSwatches,
  roleSwatches,
  constellationTitle = 'Monitoring (constellation)',
  roleSectionTitle = 'Other mesh nodes (by role)',
}: MapMarkerLegendProps) {
  const hasConstellation = constellationItems.length > 0;
  if (!hasConstellation && !showRoleSwatches) return null;

  return (
    <div
      className={cn(
        'absolute top-2 right-2 z-[1000] max-h-[40%] overflow-y-auto max-w-[min(100%,20rem)] rounded-md border bg-background/95 p-2 text-xs shadow-sm backdrop-blur-sm',
        className
      )}
      role="region"
      aria-label="Map marker colours"
    >
      <div className="flex flex-wrap gap-x-3 gap-y-2 flex-col sm:flex-row sm:items-start">
        {hasConstellation ? (
          <div className="min-w-0 flex-1 space-y-1">
            <div className="font-medium text-[0.7rem] uppercase tracking-wide text-muted-foreground">
              {constellationTitle}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {constellationItems.map((c) => (
                <SwatchRow key={c.id} label={c.name} color={c.color} />
              ))}
            </div>
          </div>
        ) : null}
        {showRoleSwatches ? (
          <div className="min-w-0 flex-1 space-y-1 border-t border-border/60 pt-2 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-3 sm:pt-0">
            <div className="font-medium text-[0.7rem] uppercase tracking-wide text-muted-foreground">
              {roleSectionTitle}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {roleSwatches.map((r) => (
                <SwatchRow key={r.key} label={r.label} color={r.color} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
