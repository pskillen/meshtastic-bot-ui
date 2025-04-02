'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { Formatter, NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface BatteryData {
  timestamp: Date;
  voltage: number;
  batteryLevel: number;
  chUtil: number;
  airUtil: number;
}

interface BatteryChartShadcnProps {
  data: BatteryData[];
  isLoading?: boolean;
  error?: Error | null;
  onTimeRangeChange: (startDate: Date, endDate: Date) => void;
  timeRangeOptions?: TimeRangeOption[];
  defaultTimeRange?: string;
}

export function BatteryChartShadcn({
  data,
  isLoading = false,
  error = null,
  onTimeRangeChange,
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

  const handleTimeRangeChange = (value: string, timeRange: { startDate: Date; endDate: Date }) => {
    console.log('handleTimeRangeChange', value, timeRange);
    if (value === timeRangeLabel) return;
    setTimeRangeLabel(value);
    onTimeRangeChange(timeRange.startDate, timeRange.endDate);
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
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center h-[400px] flex items-center justify-center">
            Failed to load battery data
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={data}>
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
              <YAxis yAxisId="voltage" orientation="right" domain={[3.0, 4.2]} tickFormatter={(value) => `${value}V`} />
              <YAxis yAxisId="battery" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: string | number) => {
                      const date = new Date(value);
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
              <Area yAxisId="voltage" type="monotone" dataKey="voltage" stroke="#d0a8ff" fill="none" strokeWidth={2} />
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
        )}
      </CardContent>
    </Card>
  );
}
