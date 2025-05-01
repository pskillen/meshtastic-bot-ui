import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useMultiNodeMetrics } from '@/lib/hooks/useMultiNodeMetrics';
import { NodeData } from '@/lib/models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { Formatter, NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface MonitoredNodesBatteryChartProps {
  nodes: NodeData[];
  timeRangeOptions?: TimeRangeOption[];
  defaultTimeRange?: string;
}

interface ChartDataPoint {
  timestamp: number;
  [key: string]: number | undefined;
}

export function MonitoredNodesBatteryChart({
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
}: MonitoredNodesBatteryChartProps) {
  const [timeRangeLabel, setTimeRangeLabel] = React.useState(defaultTimeRange);
  const [dateRange, setDateRange] = React.useState<{ startDate: Date; endDate: Date }>({
    startDate: new Date(Date.now() - 48 * 60 * 60 * 1000), // Default to 48 hours ago
    endDate: new Date(),
  });

  // Use the new hook to fetch metrics for all nodes
  const { metricsMap, isLoading, isError } = useMultiNodeMetrics(nodes, dateRange);

  // Memoize the node info mapping
  const nodeInfo = React.useMemo(
    () =>
      nodes.map((node) => ({
        nodeId: node.node_id,
        shortName: node.short_name || node.node_id_str,
      })),
    [nodes]
  );

  const handleTimeRangeChange = (value: string, timeRange: { startDate: Date; endDate: Date }) => {
    if (value === timeRangeLabel) return;
    setTimeRangeLabel(value);
    setDateRange(timeRange);
  };

  const chartConfig: ChartConfig = {
    value: {
      color: 'var(--color-value)',
      label: 'Value',
    },
  };

  const formatter: Formatter<ValueType, NameType> = (value: ValueType, name: NameType) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue !== 'number') return [String(value), name];
    return [`${numValue.toFixed(2)}V`, name];
  };

  // Transform metrics data to chart format
  const chartData = React.useMemo(() => {
    const allTimestamps = new Set<number>();
    const nodeData = new Map<number, Map<number, number>>();

    // Collect all timestamps and node data
    nodeInfo.forEach(({ nodeId }) => {
      const metrics = metricsMap[nodeId] || [];
      const nodeVoltages = new Map<number, number>();

      metrics.forEach((metric) => {
        const timestamp = metric.reported_time.getTime();
        allTimestamps.add(timestamp);
        nodeVoltages.set(timestamp, metric.voltage);
      });

      nodeData.set(nodeId, nodeVoltages);
    });

    // Create chart data points
    return Array.from(allTimestamps)
      .sort((a, b) => a - b)
      .map((timestamp) => {
        const dataPoint: ChartDataPoint = { timestamp };
        nodeInfo.forEach(({ nodeId, shortName }) => {
          const voltage = nodeData.get(nodeId)?.get(timestamp);
          if (voltage !== undefined) {
            dataPoint[shortName] = voltage;
          }
        });
        return dataPoint;
      });
  }, [nodeInfo, metricsMap]);

  const colors = ['#d0a8ff', '#76d9c4', '#ff7b72', '#7ee787', '#a371f7', '#f778ba', '#79c0ff'];

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Battery Voltage Comparison</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Compare battery voltage levels across monitored nodes</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <TimeRangeSelect options={timeRangeOptions} value={timeRangeLabel} onChange={handleTimeRangeChange} />
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="text-red-500 text-center h-[400px] flex items-center justify-center">
            Failed to load battery data
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
            <AreaChart data={chartData}>
              <defs>
                {nodeInfo.map(({ shortName }, index) => (
                  <linearGradient key={shortName} id={`gradient-${shortName}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                domain={[dateRange.startDate.getTime(), dateRange.endDate.getTime()]}
                tickFormatter={(value: number) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-GB', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  });
                }}
                scale="time"
                type="number"
              />
              <YAxis domain={[3.0, 4.2]} tickFormatter={(value) => `${value}V`} />
              <Tooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      const date = new Date(value as number);
                      return date.toLocaleDateString('en-GB', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      });
                    }}
                    formatter={formatter}
                  />
                }
              />
              {nodeInfo.map(({ shortName }, index) => (
                <Area
                  key={shortName}
                  type="monotone"
                  dataKey={shortName}
                  stroke={colors[index % colors.length]}
                  fill={`url(#gradient-${shortName})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
