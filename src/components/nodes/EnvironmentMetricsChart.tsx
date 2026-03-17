'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useNodeEnvironmentMetricsSuspense } from '@/hooks/api/useNodes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { EnvironmentMetrics } from '@/lib/models';

const SERIES_CONFIG: Array<{
  dataKey: keyof EnvironmentMetrics;
  label: string;
  unit: string;
  color: string;
}> = [
  { dataKey: 'temperature', label: 'Temperature', unit: '°C', color: '#ff7b72' },
  { dataKey: 'relative_humidity', label: 'Humidity', unit: '%', color: '#79c0ff' },
  { dataKey: 'barometric_pressure', label: 'Pressure', unit: 'hPa', color: '#d0a8ff' },
  { dataKey: 'gas_resistance', label: 'Gas Resistance', unit: 'Ω', color: '#ffa657' },
  { dataKey: 'iaq', label: 'IAQ', unit: '', color: '#7ee787' },
  { dataKey: 'lux', label: 'Lux', unit: 'lx', color: '#ffcc66' },
  { dataKey: 'wind_speed', label: 'Wind Speed', unit: 'm/s', color: '#a371f7' },
  { dataKey: 'radiation', label: 'Radiation', unit: '', color: '#f97583' },
  { dataKey: 'rainfall_1h', label: 'Rainfall 1h', unit: 'mm', color: '#58a6ff' },
  { dataKey: 'rainfall_24h', label: 'Rainfall 24h', unit: 'mm', color: '#1f6feb' },
];

export interface DateRangeProp {
  startDate: Date;
  endDate: Date;
}

interface EnvironmentMetricsChartProps {
  nodeId: number;
  timeRangeOptions?: TimeRangeOption[];
  defaultTimeRange?: string;
  /** When provided, use this date range instead of internal state (controlled mode). Hides the time range selector. */
  controlledDateRange?: DateRangeProp;
}

export function EnvironmentMetricsChart({
  nodeId,
  timeRangeOptions = [
    { key: '24h', label: '24 hours' },
    { key: '48h', label: '48 hours' },
    { key: '7d', label: '7 days' },
    { key: '14d', label: '14 days' },
  ],
  defaultTimeRange = '48h',
  controlledDateRange,
}: EnvironmentMetricsChartProps) {
  const [timeRangeLabel, setTimeRangeLabel] = React.useState(defaultTimeRange);
  const [internalDateRange, setInternalDateRange] = React.useState<{ startDate: Date; endDate: Date }>(() => {
    const now = new Date();
    const hours = defaultTimeRange.endsWith('h') ? parseInt(defaultTimeRange) || 48 : 48;
    const days = defaultTimeRange.endsWith('d') ? parseInt(defaultTimeRange) || 7 : 0;
    const startDate =
      days > 0
        ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() - hours * 60 * 60 * 1000);
    return { startDate, endDate: now };
  });

  const dateRange = controlledDateRange ?? internalDateRange;
  const isControlled = controlledDateRange != null;

  const { metrics } = useNodeEnvironmentMetricsSuspense(nodeId, dateRange);

  const handleTimeRangeChange = (value: string, timeRange: { startDate: Date; endDate: Date }) => {
    if (value === timeRangeLabel) return;
    setTimeRangeLabel(value);
    if (!isControlled) setInternalDateRange(timeRange);
  };

  const chartData = React.useMemo(() => {
    if (!metrics) return [];
    return metrics
      .filter((m) => m.reported_time != null)
      .map((m) => {
        const row: Record<string, number | null> = {
          timestamp: new Date(m.reported_time!).getTime(),
        };
        for (const s of SERIES_CONFIG) {
          const val = (m as unknown as Record<string, unknown>)[s.dataKey];
          row[s.dataKey] = typeof val === 'number' ? val : null;
        }
        return row;
      });
  }, [metrics]);

  const seriesWithData = React.useMemo(() => {
    return SERIES_CONFIG.filter((s) => chartData.some((d) => d[s.dataKey] != null));
  }, [chartData]);

  const chartConfig: ChartConfig = React.useMemo(
    () => Object.fromEntries(seriesWithData.map((s) => [s.dataKey, { color: s.color, label: s.label }])),
    [seriesWithData]
  );

  if (chartData.length === 0 || seriesWithData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Environment Metrics</CardTitle>
          <CardDescription>No environment metrics data for this time range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Environment Metrics</CardTitle>
        <CardDescription>Temperature, humidity, pressure, and other environment metrics over time</CardDescription>
        {!isControlled && (
          <div className="absolute right-4 top-4">
            <TimeRangeSelect options={timeRangeOptions} value={timeRangeLabel} onChange={handleTimeRangeChange} />
          </div>
        )}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={chartData}>
            <CartesianGrid vertical={false} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => {
                const s = SERIES_CONFIG.find((c) => c.dataKey === value);
                return s ? `${s.label}${s.unit ? ` (${s.unit})` : ''}` : value;
              }}
            />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              domain={[dateRange.startDate.getTime(), dateRange.endDate.getTime()]}
              tickFormatter={(value: number) =>
                new Date(value).toLocaleDateString('en-GB', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })
              }
              scale="time"
              type="number"
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={['auto', 'auto']} />
            <Tooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload?.timestamp) {
                      return new Date(payload[0].payload.timestamp).toLocaleDateString('en-GB', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      });
                    }
                    return 'Unknown time';
                  }}
                  formatter={(value, name) => {
                    const s = SERIES_CONFIG.find((c) => c.dataKey === name);
                    const num = typeof value === 'number' ? value : parseFloat(String(value));
                    const formatted = !isNaN(num) ? num.toFixed(2) : String(value);
                    return [s?.unit ? `${formatted} ${s.unit}` : formatted, s?.label ?? name];
                  }}
                />
              }
            />
            {seriesWithData.map((s) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                fill="none"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
