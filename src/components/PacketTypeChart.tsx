'use client';

import * as React from 'react';
import { CartesianGrid, XAxis, YAxis, Bar, BarChart, Legend } from 'recharts';
import { usePacketStats } from '@/lib/hooks/usePacketStats';
import { subDays } from 'date-fns';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { PacketStatsInterval } from '@/lib/models';
import { Payload, ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface PacketTypeChartProps {
  nodeId: number;
  defaultTimeRange?: string;
  config?: ChartConfig;
}

const PACKET_TYPE_COLORS: Record<string, string> = {
  text_message: '#3b82f6', // blue-500
  position: '#10b981', // emerald-500
  device_metrics: '#f59e0b', // amber-500
  node_info: '#8b5cf6', // violet-500
  local_stats: '#ec4899', // pink-500
  environment_metrics: '#ef4444', // red-500
  OTHER: '#6b7280', // gray-500
};

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { key: '24h', label: 'Last 24 hours' },
  { key: '48h', label: 'Last 48 hours' },
  { key: '7d', label: 'Last 7 days' },
];

const getInitialDateRange = () => {
  const endDate = new Date();
  const startDate = subDays(endDate, 1);
  return { startDate, endDate };
};

export function PacketTypeChart({
  nodeId,
  defaultTimeRange = '24h',
  config = {
    value: {
      theme: {
        light: 'var(--color-value)',
        dark: 'var(--color-value)',
      },
    },
  },
}: PacketTypeChartProps) {
  const [timeRange, setTimeRange] = React.useState(defaultTimeRange);
  const [dateRange, setDateRange] = React.useState(getInitialDateRange);

  const {
    data: packetStats,
    isLoading,
    error,
    refetch,
  } = usePacketStats({
    nodeId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Transform the data for the chart
  const chartData = React.useMemo(() => {
    if (!packetStats?.intervals) return [];

    // Create an array of timestamps for the full range
    const startTime = new Date(packetStats.start_date).getTime();
    const endTime = new Date(packetStats.end_date).getTime();
    const intervalMs = 60 * 60 * 1000; // 1 hour in milliseconds
    const timestamps = [];

    for (let time = startTime; time <= endTime; time += intervalMs) {
      timestamps.push(time);
    }

    return timestamps.map((timestamp) => {
      const data: Record<string, number> = { timestamp };

      // Initialize all packet types to 0
      Object.keys(PACKET_TYPE_COLORS).forEach((type) => {
        data[type] = 0;
      });

      // Find the matching interval for this timestamp
      const matchingInterval = packetStats.intervals.find((interval) => {
        const intervalStart = new Date(interval.start_date).getTime();
        const intervalEnd = new Date(interval.end_date).getTime();
        return timestamp >= intervalStart && timestamp < intervalEnd;
      }) as PacketStatsInterval | undefined;

      // Set the actual counts for each packet type if we found a matching interval
      if (matchingInterval) {
        matchingInterval.packet_types.forEach(({ packet_type, count }) => {
          data[packet_type] = count;
        });
      }

      return data;
    });
  }, [packetStats]);

  const handleTimeRangeChange = React.useCallback((value: string, newDateRange: { startDate: Date; endDate: Date }) => {
    setTimeRange(value);
    setDateRange(newDateRange);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Packet Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Packet Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-red-500">Error loading packet statistics</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Packet Types</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Distribution of packet types over time</span>
          <span className="@[540px]/card:hidden">
            {TIME_RANGE_OPTIONS.find((option) => option.key === timeRange)?.label}
          </span>
        </CardDescription>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <TimeRangeSelect options={TIME_RANGE_OPTIONS} value={timeRange} onChange={handleTimeRangeChange} />
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer className="aspect-auto h-[250px] w-full" config={config}>
          <BarChart data={chartData}>
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
                const date = new Date(value);
                return date.toLocaleDateString('en-GB', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                });
              }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload: Payload<ValueType, NameType>[]) => {
                    if (payload && payload[0] && payload[0].payload) {
                      const timestamp = payload[0].payload.timestamp;
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
            <Legend />
            {Object.entries(PACKET_TYPE_COLORS).map(([type, color]) => (
              <Bar
                key={type}
                dataKey={type}
                stackId="1"
                fill={color}
                name={type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
