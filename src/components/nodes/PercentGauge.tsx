import { cn } from '@/lib/utils';

interface PercentGaugeProps {
  /** Value 0–100 */
  value: number | null;
  /** Display label (e.g. "Channel Utilization") */
  label: string;
  /** When true, higher values are worse (e.g. utilization). When false, higher is better (e.g. battery). */
  higherIsWorse?: boolean;
  className?: string;
}

function getUtilizationColor(value: number, higherIsWorse: boolean): string {
  if (higherIsWorse) {
    if (value > 70) return 'bg-red-500 dark:bg-red-600';
    if (value > 40) return 'bg-amber-500 dark:bg-amber-600';
    return 'bg-emerald-500 dark:bg-emerald-600';
  }
  if (value > 60) return 'bg-emerald-500 dark:bg-emerald-600';
  if (value > 20) return 'bg-amber-500 dark:bg-amber-600';
  return 'bg-red-500 dark:bg-red-600';
}

export function PercentGauge({ value, label, higherIsWorse = true, className }: PercentGaugeProps) {
  if (value == null) {
    return (
      <div className={cn('space-y-1', className)}>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="h-8 rounded-lg bg-muted flex items-center justify-center">
          <span className="text-sm text-muted-foreground">—</span>
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.max(0, value));
  const fillColor = getUtilizationColor(pct, higherIsWorse);
  const labelText = `${pct.toFixed(1)}%`;

  return (
    <div className={cn('space-y-1.5', className)}>
      <span className="text-sm font-medium">{label}</span>
      <div className="relative h-9 rounded-lg bg-muted overflow-hidden">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-lg transition-all duration-500', fillColor)}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
              pct > 45 ? 'text-white drop-shadow-sm' : 'text-foreground'
            )}
          >
            {labelText}
          </span>
        </div>
      </div>
    </div>
  );
}
