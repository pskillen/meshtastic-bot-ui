import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { STRATEGY_META, type TracerouteStrategyValue } from '@/lib/traceroute-strategy';

export function StrategyBadge({
  value,
  className,
}: {
  /** API field; null / undefined renders Legacy */
  value: TracerouteStrategyValue | string | null | undefined;
  className?: string;
}) {
  const key: TracerouteStrategyValue = value == null || value === '' ? 'legacy' : (value as TracerouteStrategyValue);
  const meta = STRATEGY_META[key] ?? STRATEGY_META.legacy;

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
