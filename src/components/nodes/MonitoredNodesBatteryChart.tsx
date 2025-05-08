import * as React from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceArea } from 'recharts';
import { useMultiNodeMetricsSuspense } from '@/hooks/api/useMultiNodeMetrics';
import { ObservedNode } from '@/lib/models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { Formatter, NameType, ValueType, Payload } from 'recharts/types/component/DefaultTooltipContent';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Extended payload type with activeLabel
interface ExtendedPayload extends Payload<ValueType, NameType> {
  activeLabel?: number;
}

interface MonitoredNodesBatteryChartProps {
  nodes: ObservedNode[];
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
  const [displayMode, setDisplayMode] = React.useState<'voltage' | 'percentage'>('voltage');

  // Use the new hook to fetch metrics for all nodes
  const { metricsMap } = useMultiNodeMetricsSuspense(nodes, dateRange);

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

  // Transform metrics data to chart format - pivot so all series share the same x-axis
  const { pivotedData, seriesNames } = React.useMemo(() => {
    // 1. Collect all unique timestamps
    const allTimestamps = Array.from(
      new Set(
        nodes.flatMap((node) => {
          const metrics = metricsMap[node.node_id] || [];
          return metrics.map((metric) => new Date(metric.reported_time).getTime());
        })
      )
    ).sort((a, b) => a - b);

    // 2. Build a lookup for each node
    const nodeLookups: Record<string, Record<number, number>> = {};
    nodes.forEach((node) => {
      const metrics = metricsMap[node.node_id] || [];
      const lookup: Record<number, number> = {};
      metrics.forEach((metric) => {
        lookup[new Date(metric.reported_time).getTime()] = metric.voltage;
      });
      nodeLookups[node.short_name || node.node_id_str] = lookup;
    });

    // 3. Build the pivoted data array
    const pivoted = allTimestamps.map((timestamp) => {
      const row: Record<string, number | null> = { timestamp };
      for (const node of nodes) {
        const name = node.short_name || node.node_id_str;
        row[name] = nodeLookups[name][timestamp] ?? null;
      }
      return row;
    });

    const seriesNames = nodes.map((node) => node.short_name || node.node_id_str);
    return { pivotedData: pivoted, seriesNames };
  }, [nodes, metricsMap]);

  // Helper for ReferenceArea shading
  const getShadingAreas = () => {
    if (displayMode === 'voltage') {
      return [
        // Dangerously low (red)
        { y1: 3.0, y2: 3.3, color: 'rgba(255, 0, 0, 0.15)', label: 'Dangerously Low' },
        // Inconveniently low (yellow)
        { y1: 3.3, y2: 3.6, color: 'rgba(255, 255, 0, 0.10)', label: 'Low' },
        // Normal (green)
        { y1: 3.6, y2: 4.2, color: 'rgba(0, 255, 0, 0.08)', label: 'Normal' },
        // Dangerously high (red, rare for lipo)
        { y1: 4.2, y2: 4.3, color: 'rgba(255, 0, 0, 0.10)', label: 'Dangerously High' },
      ];
    } else {
      return [
        // Dangerously low (red)
        { y1: 0, y2: 20, color: 'rgba(255, 0, 0, 0.15)', label: 'Dangerously Low' },
        // Inconveniently low (yellow)
        { y1: 20, y2: 40, color: 'rgba(255, 255, 0, 0.10)', label: 'Low' },
        // Normal (green)
        { y1: 40, y2: 100, color: 'rgba(0, 255, 0, 0.08)', label: 'Normal' },
      ];
    }
  };

  // Formatter for tooltip and axis
  const formatter: Formatter<ValueType, NameType> = (value: ValueType, name: NameType) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue !== 'number' || isNaN(numValue)) return ['-', name];
    if (displayMode === 'voltage') {
      return [`${numValue.toFixed(2)}V`, name];
    } else {
      return [`${numValue.toFixed(1)}%`, name];
    }
  };

  // Prepare chart data for selected mode
  const chartData = React.useMemo(() => {
    if (displayMode === 'voltage') return pivotedData;
    // For percentage, build a similar pivoted array but with battery_level
    // Build lookups for percentage
    const allTimestamps = pivotedData.map((row) => row.timestamp);
    const nodeLookups: Record<string, Record<number, number>> = {};
    nodes.forEach((node) => {
      const metrics = metricsMap[node.node_id] || [];
      const lookup: Record<number, number> = {};
      metrics.forEach((metric) => {
        lookup[new Date(metric.reported_time).getTime()] = metric.battery_level;
      });
      const name = node.short_name || node.node_id_str || String(node.node_id);
      nodeLookups[name] = lookup;
    });
    return allTimestamps.map((timestamp) => {
      const row: Record<string, number | null> = { timestamp };
      for (const node of nodes) {
        const name = node.short_name || node.node_id_str || String(node.node_id);
        if (timestamp !== undefined && timestamp !== null) {
          row[name] = nodeLookups[name][timestamp] ?? null;
        } else {
          row[name] = null;
        }
      }
      return row;
    });
  }, [displayMode, pivotedData, nodes, metricsMap]);

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
        <div className="flex items-center gap-2 mb-2">
          <Switch
            id="display-mode"
            checked={displayMode === 'percentage'}
            onCheckedChange={(checked) => setDisplayMode(checked ? 'percentage' : 'voltage')}
          />
          <Label htmlFor="display-mode">Show as {displayMode === 'voltage' ? 'Voltage' : 'Percentage'}</Label>
        </div>
        <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
          <LineChart data={chartData}>
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
            <YAxis
              domain={displayMode === 'voltage' ? [3.0, 4.2] : [0, 100]}
              tickFormatter={displayMode === 'voltage' ? (value) => `${value}V` : (value) => `${value}%`}
            />
            {/* Shading areas */}
            {getShadingAreas().map((area, idx) => (
              <ReferenceArea
                key={idx}
                y1={area.y1}
                y2={area.y2}
                stroke={undefined}
                fill={area.color}
                ifOverflow="extendDomain"
              />
            ))}
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
