import type { ReactNode } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface MetricItem {
  label: string;
  value: number | string | null | undefined;
  unit?: string;
}

interface MetricsCardProps {
  title: string;
  reportedTime?: Date | string | null;
  metrics: MetricItem[];
  /** Shown on the right of the title row (e.g. settings). */
  headerActions?: ReactNode;
}

/**
 * Renders a Card with metric key-value pairs. Only displays metrics with non-null values.
 */
export function MetricsCard({ title, reportedTime, metrics, headerActions }: MetricsCardProps) {
  const validMetrics = metrics.filter((m) => m.value != null && m.value !== '');
  if (validMetrics.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className={headerActions ? 'flex flex-row items-start justify-between gap-3 space-y-0' : undefined}>
        <div className="min-w-0 flex-1 space-y-1.5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {reportedTime ? formatDistanceToNow(new Date(reportedTime), { addSuffix: true }) : '—'}
          </CardDescription>
        </div>
        {headerActions ? <div className="shrink-0 pt-0.5">{headerActions}</div> : null}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {validMetrics.map((m) => (
            <p key={m.label}>
              <span className="font-medium">{m.label}:</span>{' '}
              {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
              {m.unit ? ` ${m.unit}` : ''}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
