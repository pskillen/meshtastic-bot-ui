import { cn } from '@/lib/utils';

interface BatteryGaugeProps {
  /** Battery level 0–100 */
  batteryLevel: number | null;
  /** Voltage in volts */
  voltage: number | null;
  className?: string;
}

function getBatteryColor(level: number): string {
  if (level > 60) return 'bg-emerald-500 dark:bg-emerald-600';
  if (level > 20) return 'bg-amber-500 dark:bg-amber-600';
  return 'bg-red-500 dark:bg-red-600';
}

export function BatteryGauge({ batteryLevel, voltage, className }: BatteryGaugeProps) {
  const hasLevel = batteryLevel != null;
  const hasVoltage = voltage != null;
  const hasData = hasLevel || hasVoltage;

  if (!hasData) {
    return (
      <div className={cn('space-y-1', className)}>
        <span className="text-sm font-medium text-muted-foreground">Battery</span>
        <div className="h-8 rounded-lg bg-muted flex items-center justify-center">
          <span className="text-sm text-muted-foreground">—</span>
        </div>
      </div>
    );
  }

  const level = hasLevel ? Math.min(100, Math.max(0, batteryLevel)) : null;
  const fillWidth = level != null ? level : 0;
  const fillColor = level != null ? getBatteryColor(level) : 'bg-muted-foreground/30';

  const label =
    hasVoltage && hasLevel
      ? `${voltage.toFixed(2)}V / ${Math.round(level ?? 0)}%`
      : hasVoltage
        ? `${voltage.toFixed(2)}V`
        : `${Math.round(level ?? 0)}%`;

  return (
    <div className={cn('space-y-1.5', className)}>
      <span className="text-sm font-medium">Battery</span>
      <div className="relative h-9 rounded-lg bg-muted overflow-hidden">
        {/* Fill bar */}
        <div
          className={cn('absolute inset-y-0 left-0 rounded-lg transition-all duration-500', fillColor)}
          style={{ width: `${fillWidth}%` }}
        />
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
              fillWidth > 45 ? 'text-white drop-shadow-sm' : 'text-foreground'
            )}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
