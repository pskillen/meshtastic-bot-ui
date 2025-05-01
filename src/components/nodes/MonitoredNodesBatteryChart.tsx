import * as React from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useMultiNodeMetrics } from '@/lib/hooks/useMultiNodeMetrics';
import { NodeData } from '@/lib/models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { Formatter, NameType, ValueType, Payload } from 'recharts/types/component/DefaultTooltipContent';

// Extended payload type with activeLabel
interface ExtendedPayload extends Payload<ValueType, NameType> {
  activeLabel?: number;
}

interface MonitoredNodesBatteryChartProps {
  nodes: NodeData[];
  timeRangeOptions?: TimeRangeOption[];
  defaultTimeRange?: string;
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
    if (typeof numValue !== 'number' || isNaN(numValue)) return ['-', name];
    return [`${numValue.toFixed(2)}V`, name];
  };

  // Transform metrics data to chart format - each node's data is kept separate
  const chartData = React.useMemo(() => {
    return nodeInfo.map(({ nodeId, shortName }) => {
      const metrics = metricsMap[nodeId] || [];
      return {
        name: shortName,
        data: metrics
          .map((metric) => ({
            timestamp: new Date(metric.reported_time).getTime(),
            value: metric.voltage,
          }))
          .sort((a, b) => a.timestamp - b.timestamp),
      };
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
            <LineChart>
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
              <YAxis domain={[3.0, 4.2]} tickFormatter={(value) => `${value}V`} />
              <Tooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload: Payload<ValueType, NameType>[]) => {
                      // Extract the timestamp from the payload
                      if (payload && payload[0] && payload[0].payload && payload[0].payload.timestamp) {
                        const date = new Date(payload[0].payload.timestamp);
                        return date.toLocaleString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        });
                      }
                      // If we can't find the timestamp in the payload, use the activeLabel
                      const extendedPayload = payload as ExtendedPayload[];
                      if (extendedPayload && extendedPayload[0] && extendedPayload[0].activeLabel) {
                        const date = new Date(extendedPayload[0].activeLabel);
                        return date.toLocaleString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        });
                      }
                      // Fallback if we can't find any timestamp
                      return 'Unknown time';
                    }}
                    formatter={formatter}
                  />
                }
              />
              {chartData.map((series, index) => (
                <Line
                  key={series.name}
                  name={series.name}
                  data={series.data}
                  dataKey="value"
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  type="monotone"
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
