'use client';

import * as React from 'react';
import { CartesianGrid, XAxis, YAxis, Bar, Line, ComposedChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { useStatsSnapshotsForTypesSuspense } from '@/hooks/api/useStatsSnapshots';
import { subDays } from 'date-fns';
import { Payload, ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { getAggregationWindow, aggregateStats } from '@/lib/stats-aggregation';

interface OnlineNodesChartProps {
  title: string;
  description?: string;
  config: ChartConfig;
  timeRangeOptions?: TimeRangeOption[];
  defaultTimeRange?: string;
  /** When true, render without Card/TimeRangeSelect; use dateRange from parent */
  embedded?: boolean;
  dateRange?: { startDate: Date; endDate: Date };
}

export function OnlineNodesChart({
  title,
  description,
  config,
  timeRangeOptions = [
    { key: '48h', label: 'Last 48 hours' },
    { key: '1d', label: 'Today' },
    { key: '2d', label: 'Last 2 days' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
  ],
  defaultTimeRange = '2d',
  embedded = false,
  dateRange: controlledDateRange,
}: OnlineNodesChartProps) {
  const [timeRangeLabel, setTimeRangeLabel] = React.useState(defaultTimeRange);
  const [internalDateRange, setInternalDateRange] = React.useState<{ startDate: Date; endDate: Date }>({
    startDate: subDays(new Date(), 2),
    endDate: new Date(),
  });

  const dateRange = embedded && controlledDateRange ? controlledDateRange : internalDateRange;

  const params = React.useMemo(
    () => ({
      constellationId: -1,
      recordedAtAfter: dateRange.startDate,
      recordedAtBefore: dateRange.endDate,
      page_size: 1000,
    }),
    [dateRange.startDate, dateRange.endDate]
  );

  const { online_nodes: onlineSnapshots, new_nodes: newNodesSnapshots } = useStatsSnapshotsForTypesSuspense(
    ['online_nodes', 'new_nodes'] as const,
    params
  );

  const handleTimeRangeChange = (value: string, timeRange: { startDate: Date; endDate: Date }) => {
    if (value === timeRangeLabel) return;
    setTimeRangeLabel(value);
    setInternalDateRange(timeRange);
  };

  const aggregationWindow = React.useMemo(
    () => getAggregationWindow(dateRange.startDate, dateRange.endDate),
    [dateRange.startDate, dateRange.endDate]
  );

  // Merge online_nodes and new_nodes by timestamp, aggregate, add moving average
  const chartData = React.useMemo(() => {
    const online = onlineSnapshots?.results?.filter((s) => s.constellation_id === null) ?? [];
    const newNodes = newNodesSnapshots?.results?.filter((s) => s.constellation_id === null) ?? [];

    const byTs = new Map<number, { online: number; newNodes: number }>();
    for (const s of online) {
      const ts = new Date(s.recorded_at).getTime();
      byTs.set(ts, { online: s.value?.count ?? 0, newNodes: byTs.get(ts)?.newNodes ?? 0 });
    }
    for (const s of newNodes) {
      const ts = new Date(s.recorded_at).getTime();
      const existing = byTs.get(ts);
      byTs.set(ts, {
        online: existing?.online ?? 0,
        newNodes: s.value?.count ?? 0,
      });
    }

    const raw = Array.from(byTs.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ts, v]) => ({ timestamp: ts, value: v.online, newNodes: v.newNodes }));

    const onlineAgg = aggregateStats(
      raw.map((s) => ({ timestamp: s.timestamp, value: s.value })),
      aggregationWindow,
      'average'
    );
    const newNodesAgg = aggregateStats(
      raw.map((s) => ({ timestamp: s.timestamp, value: s.newNodes })),
      aggregationWindow,
      'sum'
    );
    const newNodesByTs = new Map(newNodesAgg.map((s) => [s.timestamp, s.value]));
    const stats = onlineAgg.map((s) => ({
      ...s,
      newNodes: newNodesByTs.get(s.timestamp) ?? 0,
    }));

    const windowSize = aggregationWindow === 'hourly' ? Math.min(24, stats.length) : Math.min(4, stats.length);
    return stats.map((stat, index) => {
      const startIdx = Math.max(0, index - windowSize + 1);
      const window = stats.slice(startIdx, index + 1);
      const avg = window.length > 0 ? window.reduce((acc, i) => acc + i.value, 0) / window.length : 0;
      return { ...stat, movingAverage: avg };
    });
  }, [onlineSnapshots, newNodesSnapshots, aggregationWindow]);

  const yAxisDomain = React.useMemo(() => {
    if (!chartData.length) return [0, 'auto'] as [number, 'auto'];
    const values = chartData.map((item) => item.value);
    const maxVal = Math.max(...values, 1);
    return [0, maxVal] as [number, number];
  }, [chartData]);

  const tickFormatter = (value: number) => {
    const date = new Date(value);
    if (aggregationWindow === 'daily') {
      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    }
    if (aggregationWindow === '6h') {
      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', hour: 'numeric' });
    }
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const tooltipLabelFormatter = (_: unknown, payload: Payload<ValueType, NameType>[]) => {
    if (payload?.[0]?.payload?.timestamp != null) {
      return tickFormatter(payload[0].payload.timestamp);
    }
    return 'Unknown time';
  };

  const chartContent = (
    <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
      <ComposedChart data={chartData}>
        <defs>
          <linearGradient id="fillOnlineNodes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={1.0} />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="timestamp"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={80}
          tickCount={6}
          scale="time"
          type="number"
          domain={[dateRange.startDate.getTime(), dateRange.endDate.getTime()]}
          tickFormatter={tickFormatter}
        />
        <YAxis domain={yAxisDomain} tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelFormatter={tooltipLabelFormatter} indicator="dot" />}
        />
        <Bar dataKey="value" fill="var(--color-value)" fillOpacity={0.7} barSize={8} />
        <Line
          type="monotone"
          dataKey="newNodes"
          stroke="var(--color-newNodes)"
          strokeWidth={2}
          dot={false}
          name="New nodes"
        />
        <Line
          type="monotone"
          dataKey="movingAverage"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={false}
          name={aggregationWindow === 'hourly' ? '24h Moving Average' : 'Moving Average'}
        />
      </ComposedChart>
    </ChartContainer>
  );

  if (embedded) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-1">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mb-2">{description}</p>}
        {chartContent}
      </div>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>
            <span className="@[540px]/card:block hidden">{description}</span>
            <span className="@[540px]/card:hidden">
              {timeRangeOptions.find((option) => option.key === timeRangeLabel)?.label}
            </span>
          </CardDescription>
        )}
        <div className="absolute right-4 top-4">
          <TimeRangeSelect options={timeRangeOptions} value={timeRangeLabel} onChange={handleTimeRangeChange} />
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">{chartContent}</CardContent>
    </Card>
  );
}
