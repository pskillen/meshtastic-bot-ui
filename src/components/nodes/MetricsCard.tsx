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
}

/**
 * Renders a Card with metric key-value pairs. Only displays metrics with non-null values.
 */
export function MetricsCard({ title, reportedTime, metrics }: MetricsCardProps) {
  const validMetrics = metrics.filter((m) => m.value != null && m.value !== '');
  if (validMetrics.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {reportedTime ? formatDistanceToNow(new Date(reportedTime), { addSuffix: true }) : '—'}
        </CardDescription>
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
