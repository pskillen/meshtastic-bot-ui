import * as React from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceArea } from 'recharts';
import { useMultiNodeMetricsSuspense } from '@/hooks/api/useMultiNodeMetrics';
import { ObservedNode } from '@/lib/models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { Formatter, NameType, ValueType, Payload } from 'recharts/types/component/DefaultTooltipContent';

interface ExtendedPayload extends Payload<ValueType, NameType> {
  activeLabel?: number;
}

interface MonitoredNodesChannelUtilChartProps {
  nodes: ObservedNode[];
  timeRangeOptions?: TimeRangeOption[];
  defaultTimeRange?: string;
  /** When provided, chart uses controlled mode: dateRange from parent */
  dateRange?: { startDate: Date; endDate: Date };
  /** When true, hide the time range picker (for use inside a shared container) */
  hideTimeRangePicker?: boolean;
}

export function MonitoredNodesChannelUtilChart({
  nodes,
  timeRangeOptions = [
    { key: '24h', label: '24 hours' },
    { key: '48h', label: '48 hours' },
    { key: '1d', label: 'Today' },
    { key: '2d', label: '2 days' },
    { key: '7d', label: '7 days' },
    { key: '14d', label: '14 days' },
  ],
  defaultTimeRange = '48h',
  dateRange: controlledDateRange,
  hideTimeRangePicker = false,
}: MonitoredNodesChannelUtilChartProps) {
  const [internalTimeRangeLabel, setInternalTimeRangeLabel] = React.useState(defaultTimeRange);
  const [internalDateRange, setInternalDateRange] = React.useState<{ startDate: Date; endDate: Date }>({
    startDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  const isControlled = controlledDateRange != null;
  const dateRange = isControlled ? controlledDateRange : internalDateRange;

  const { metricsMap } = useMultiNodeMetricsSuspense(nodes, dateRange);

  const handleTimeRangeChange = (value: string, timeRange: { startDate: Date; endDate: Date }) => {
    if (value === internalTimeRangeLabel) return;
    setInternalTimeRangeLabel(value);
    setInternalDateRange(timeRange);
  };

  const chartConfig: ChartConfig = {
    value: {
      color: 'var(--color-value)',
      label: 'Channel utilisation %',
    },
  };

  const { pivotedData, seriesNames } = React.useMemo(() => {
    const allTimestamps = Array.from(
      new Set(
        nodes.flatMap((node) => {
          const metrics = metricsMap[node.node_id] || [];
          return metrics.filter((m) => m.reported_time != null).map((m) => new Date(m.reported_time!).getTime());
        })
      )
    ).sort((a, b) => a - b);

    const nodeLookups: Record<string, Record<number, number>> = {};
    nodes.forEach((node) => {
      const metrics = metricsMap[node.node_id] || [];
      const lookup: Record<number, number> = {};
      metrics
        .filter((m) => m.reported_time != null)
        .forEach((m) => {
          lookup[new Date(m.reported_time!).getTime()] = m.channel_utilization;
        });
      nodeLookups[node.short_name || node.node_id_str] = lookup;
    });

    const pivoted = allTimestamps.map((timestamp) => {
      const row: Record<string, number | null> = { timestamp };
      for (const node of nodes) {
        const name = node.short_name || node.node_id_str;
        row[name] = nodeLookups[name]?.[timestamp] ?? null;
      }
      return row;
    });

    const names = nodes.map((node) => node.short_name || node.node_id_str);
    return { pivotedData: pivoted, seriesNames: names };
  }, [nodes, metricsMap]);

  const formatter: Formatter<ValueType, NameType> = (value: ValueType, name: NameType) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue !== 'number' || isNaN(numValue)) return ['-', name];
    return [`${numValue.toFixed(1)}%`, name];
  };

  const colors = ['#d0a8ff', '#76d9c4', '#ff7b72', '#7ee787', '#a371f7', '#f778ba', '#79c0ff'];

  return (
    <Card className="@container/card">
      <CardHeader className={hideTimeRangePicker ? '' : 'relative'}>
        <CardTitle>Channel Utilisation</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Compare channel utilisation across nodes over time</span>
        </CardDescription>
        {!hideTimeRangePicker && (
          <div className="absolute right-4 top-4">
            <TimeRangeSelect
              options={timeRangeOptions}
              value={internalTimeRangeLabel}
              onChange={handleTimeRangeChange}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
          <LineChart data={pivotedData}>
            <CartesianGrid vertical={false} />
            <Legend verticalAlign="bottom" height={36} iconType="line" iconSize={8} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              domain={[dateRange.startDate.getTime(), dateRange.endDate.getTime()]}
              tickFormatter={(value: number) => {
                const date = new Date(value);
                return date.toLocaleString('en-GB', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                });
              }}
              scale="time"
              type="number"
            />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <ReferenceArea y1={0} y2={50} fill="rgba(0, 255, 0, 0.06)" ifOverflow="extendDomain" />
            <ReferenceArea y1={50} y2={80} fill="rgba(255, 255, 0, 0.08)" ifOverflow="extendDomain" />
            <ReferenceArea y1={80} y2={100} fill="rgba(255, 0, 0, 0.08)" ifOverflow="extendDomain" />
            <Tooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload: Payload<ValueType, NameType>[]) => {
                    if (payload?.[0]?.payload?.timestamp) {
                      const date = new Date(payload[0].payload.timestamp);
                      return date.toLocaleString('en-GB', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      });
                    }
                    const ext = payload as ExtendedPayload[];
                    if (ext?.[0]?.activeLabel) {
                      const date = new Date(ext[0].activeLabel);
                      return date.toLocaleString('en-GB', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      });
                    }
                    return 'Unknown time';
                  }}
                  formatter={formatter}
                />
              }
            />
            {seriesNames.map((seriesName, index) => (
              <Line
                key={seriesName}
                name={seriesName}
                dataKey={seriesName}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={true}
                type="monotone"
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
