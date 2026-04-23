import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { STRATEGY_META, type TracerouteStrategyDisplayValue } from '@/lib/traceroute-strategy';

export function StrategyBadge({
  value,
  className,
}: {
  /** API field; null / undefined renders an em dash (e.g. external traceroutes). */
  value: TracerouteStrategyDisplayValue | string | null | undefined;
  className?: string;
}) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const key = value as TracerouteStrategyDisplayValue;
  const meta =
    key in STRATEGY_META
      ? STRATEGY_META[key]
      : { label: String(value), shortDescription: 'Unknown strategy value', badgeVariant: 'outline' as const };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Badge variant={meta.badgeVariant} className={className}>
              {meta.label}
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{meta.shortDescription}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
