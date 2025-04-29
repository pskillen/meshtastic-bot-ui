'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useNodes } from '@/lib/hooks/useNodes';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { Formatter, NameType, ValueType, Payload } from 'recharts/types/component/DefaultTooltipContent';

// Extended payload type with activeLabel
interface ExtendedPayload extends Payload<ValueType, NameType> {
  activeLabel?: number;
}

interface BatteryChartShadcnProps {
  nodeId: number;
  timeRangeOptions?: TimeRangeOption[];
  defaultTimeRange?: string;
}

export function BatteryChartShadcn({
  nodeId,
  timeRangeOptions = [
    { key: '24h', label: '24 hours' },
    { key: '48h', label: '48 hours' },
    { key: '1d', label: 'Today' },
    { key: '2d', label: '2 days' },
    { key: '7d', label: '7 days' },
    { key: '14d', label: '14 days' },
  ],
  defaultTimeRange = '48h',
}: BatteryChartShadcnProps) {
  const [timeRangeLabel, setTimeRangeLabel] = React.useState(defaultTimeRange);
  const [dateRange, setDateRange] = React.useState<{ startDate: Date; endDate: Date }>({
    startDate: new Date(Date.now() - 48 * 60 * 60 * 1000), // Default to 48 hours ago
    endDate: new Date(),
  });

  const { useNodeMetrics } = useNodes();
  const metricsQuery = useNodeMetrics(nodeId, dateRange);

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

    switch (name) {
      case 'voltage':
        return [`${numValue.toFixed(2)}V`, 'Voltage'];
      case 'batteryLevel':
        return [`${numValue.toFixed(1)}%`, 'Battery Level'];
      case 'chUtil':
        return [`${numValue.toFixed(1)}%`, 'Channel Utilization'];
      case 'airUtil':
        return [`${numValue.toFixed(1)}%`, 'Air Utilization'];
      default:
        return [String(value), name];
    }
  };

  // Transform metrics data to chart format
  const chartData = React.useMemo(() => {
    if (!metricsQuery.data) return [];

    return metricsQuery.data.map((metric) => ({
      timestamp: metric.reported_time.getTime(),
      voltage: metric.voltage,
      batteryLevel: metric.battery_level,
      chUtil: metric.channel_utilization,
      airUtil: metric.air_util_tx,
    }));
  }, [metricsQuery.data]);

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Battery & Utilization</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Battery voltage, level, and channel utilization over time</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <TimeRangeSelect options={timeRangeOptions} value={timeRangeLabel} onChange={handleTimeRangeChange} />
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {metricsQuery.isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : metricsQuery.error ? (
          <div className="text-red-500 text-center h-[400px] flex items-center justify-center">
            Failed to load battery data
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d0a8ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#d0a8ff" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="batteryLevelGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#76d9c4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#76d9c4" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    switch (value) {
                      case 'voltage':
                        return 'Voltage (V)';
                      case 'batteryLevel':
                        return 'Battery Level (%)';
                      case 'chUtil':
                        return 'Channel Utilization (%)';
                      case 'airUtil':
                        return 'Air Utilization (%)';
                      default:
                        return value;
                    }
                  }}
                />
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
                <YAxis
                  yAxisId="voltage"
                  orientation="right"
                  domain={[3.0, 4.2]}
                  tickFormatter={(value) => `${value}V`}
                />
                <YAxis yAxisId="battery" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload: Payload<ValueType, NameType>[]) => {
                        // Extract the timestamp from the activeLabel property
                        if (payload && payload[0] && payload[0].payload && payload[0].payload.timestamp) {
                          const date = new Date(payload[0].payload.timestamp);
                          return date.toLocaleDateString('en-GB', {
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
                          return date.toLocaleDateString('en-GB', {
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
                <Area
                  yAxisId="voltage"
                  type="monotone"
                  dataKey="voltage"
                  stroke="#d0a8ff"
                  fill="none"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="battery"
                  type="monotone"
                  dataKey="batteryLevel"
                  stroke="#76d9c4"
                  fill="none"
                  strokeWidth={2}
                />
                <Area yAxisId="battery" type="monotone" dataKey="chUtil" stroke="#ff7b72" fill="none" dot={{ r: 4 }} />
                <Area yAxisId="battery" type="monotone" dataKey="airUtil" stroke="#ffa657" fill="none" dot={{ r: 4 }} />
              </AreaChart>
            </ChartContainer>

            {/* Debug Information */}
            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono overflow-auto">
              <h3 className="font-bold mb-2">Debug Information</h3>

              <div className="mb-4">
                <h4 className="font-semibold">Date Range:</h4>
                <p>
                  Start: {dateRange.startDate.toISOString()} ({dateRange.startDate.getTime()})
                </p>
                <p>
                  End: {dateRange.endDate.toISOString()} ({dateRange.endDate.getTime()})
                </p>
                <p>
                  Duration:{' '}
                  {Math.round((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60))} hours
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold">Data Points ({chartData.length}):</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="border p-1 text-left">Index</th>
                        <th className="border p-1 text-left">Raw timestamp</th>
                        <th className="border p-1 text-left">Timestamp</th>
                        <th className="border p-1 text-left">Timestamp (ms)</th>
                        <th className="border p-1 text-left">Voltage</th>
                        <th className="border p-1 text-left">Battery Level</th>
                        <th className="border p-1 text-left">Ch Util</th>
                        <th className="border p-1 text-left">Air Util</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((point, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''}>
                          <td className="border p-1">{index}</td>
                          <td className="border p-1">{point.timestamp}</td>
                          <td className="border p-1">{new Date(point.timestamp).toISOString()}</td>
                          <td className="border p-1">{new Date(point.timestamp).getTime()}</td>
                          <td className="border p-1">{point.voltage}</td>
                          <td className="border p-1">{point.batteryLevel}</td>
                          <td className="border p-1">{point.chUtil}</td>
                          <td className="border p-1">{point.airUtil}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Raw API Response:</h4>
                <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(metricsQuery.data, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
