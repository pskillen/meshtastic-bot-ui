'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { usePacketStats } from '@/lib/hooks/usePacketStats';
import { subDays } from 'date-fns';
import { Payload, ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface PacketStatsChartProps {
  nodeId?: number;
  title: string;
  description?: string;
  config: ChartConfig;
  timeRangeOptions?: TimeRangeOption[];
  defaultTimeRange?: string;
}

export function PacketStatsChart({
  nodeId,
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
}: PacketStatsChartProps) {
  const [timeRangeLabel, setTimeRangeLabel] = React.useState(defaultTimeRange);
  const [dateRange, setDateRange] = React.useState<{ startDate: Date; endDate: Date }>({
    startDate: subDays(new Date(), 2), // Default to 2 days ago
    endDate: new Date(),
  });

  // Use the usePacketStats hook to fetch data
  const {
    data: packetStats,
    isLoading,
    error,
  } = usePacketStats({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    nodeId,
  });

  const handleTimeRangeChange = (value: string, timeRange: { startDate: Date; endDate: Date }) => {
    console.log('handleTimeRangeChange', value, timeRange);
    if (value === timeRangeLabel) return;
    setTimeRangeLabel(value);
    setDateRange(timeRange);
  };

  // Transform the data for the chart
  const chartData = React.useMemo(() => {
    if (!packetStats?.hourly_stats) return [];

    return packetStats.hourly_stats.map((stat) => ({
      // Convert timestamp to number (milliseconds)
      timestamp: stat.timestamp.getTime(),
      value: stat.total_packets >= 0 ? stat.total_packets : 0,
    }));
  }, [packetStats]);

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>
            <span className="@[540px]/card:block hidden">{description}</span>
            <span className="@[540px]/card:hidden">
              Last {timeRangeLabel === '90d' ? '3 months' : timeRangeLabel === '30d' ? '30 days' : '7 days'}
            </span>
          </CardDescription>
        )}
        <div className="absolute right-4 top-4">
          <TimeRangeSelect options={timeRangeOptions} value={timeRangeLabel} onChange={handleTimeRangeChange} />
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center h-[250px] flex items-center justify-center">
            Failed to load packet statistics
          </div>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={(value) => {
                  // Convert number to Date for display
                  const date = new Date(value);
                  return date.toLocaleDateString('en-GB', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload: Payload<ValueType, NameType>[]) => {
                      // Extract the timestamp from the payload
                      if (payload && payload[0] && payload[0].payload) {
                        const timestamp = payload[0].payload.timestamp;
                        // Convert number to Date for display
                        const date = new Date(timestamp);
                        return date.toLocaleDateString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        });
                      }
                      return 'Unknown time';
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area dataKey="value" type="monotone" fill="url(#fillValue)" stroke="var(--color-value)" />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
