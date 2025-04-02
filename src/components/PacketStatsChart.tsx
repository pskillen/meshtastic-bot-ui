'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';

interface PacketStatsChartProps {
  data: { timestamp: Date; value: number }[];
  title: string;
  description?: string;
  config: ChartConfig;
  onTimeRangeChange: (startDate: Date, endDate: Date) => void;
  timeRangeOptions?: TimeRangeOption[];
  defaultTimeRange?: string;
}

export function PacketStatsChart({
  data,
  title,
  description,
  config,
  onTimeRangeChange,
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

  const handleTimeRangeChange = (value: string, timeRange: { startDate: Date; endDate: Date }) => {
    console.log('handleTimeRangeChange', value, timeRange);
    if (value === timeRangeLabel) return;
    setTimeRangeLabel(value);
    onTimeRangeChange(timeRange.startDate, timeRange.endDate);
  };

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
        <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
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
              minTickGap={32}
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
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0] && payload[0].payload) {
                      const timestamp = payload[0].payload.timestamp;
                      if (timestamp instanceof Date) {
                        return timestamp.toLocaleDateString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        });
                      }
                      // If it's a string timestamp, try to parse it
                      if (typeof timestamp === 'string') {
                        const date = new Date(timestamp);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          });
                        }
                      }
                    }
                    return value;
                  }}
                  indicator="dot"
                />
              }
            />
            <Area dataKey="value" type="monotone" fill="url(#fillValue)" stroke="var(--color-value)" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
