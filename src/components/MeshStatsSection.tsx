'use client';

import * as React from 'react';
import { subDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { OnlineNodesChart } from '@/components/OnlineNodesChart';
import { PacketStatsChartFromSnapshots } from '@/components/PacketStatsChartFromSnapshots';
import { ChartConfig } from '@/components/ui/chart';
import { PACKET_TYPE_DISPLAY_NAMES } from '@/lib/stats-aggregation';

const MESH_STATS_TIME_OPTIONS: TimeRangeOption[] = [
  { key: '48h', label: 'Last 48 hours' },
  { key: '1d', label: 'Today' },
  { key: '2d', label: 'Last 2 days' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
];

const onlineNodesOnlyChartConfig = {
  value: {
    label: 'Online nodes',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const newNodesOnlyChartConfig = {
  value: {
    label: 'New nodes',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

const PACKET_TYPE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220 70% 50%)',
  'hsl(280 60% 55%)',
];

const packetChartConfig = {
  value: {
    label: 'Packets',
    color: 'hsl(var(--chart-2))',
  },
  ...Object.fromEntries(
    Object.keys(PACKET_TYPE_DISPLAY_NAMES).map((k, i) => [
      k,
      { label: PACKET_TYPE_DISPLAY_NAMES[k], color: PACKET_TYPE_COLORS[i % PACKET_TYPE_COLORS.length] },
    ])
  ),
} satisfies ChartConfig;

export function MeshStatsSection() {
  const [timeRangeKey, setTimeRangeKey] = React.useState('2d');
  const [dateRange, setDateRange] = React.useState<{ startDate: Date; endDate: Date }>({
    startDate: subDays(new Date(), 2),
    endDate: new Date(),
  });

  const handleTimeRangeChange = (value: string, timeRange: { startDate: Date; endDate: Date }) => {
    if (value === timeRangeKey) return;
    setTimeRangeKey(value);
    setDateRange(timeRange);
  };

  return (
    <Card data-testid="dashboard-mesh-stats">
      <CardHeader className="relative">
        <CardTitle>Mesh stats</CardTitle>
        <CardDescription>
          Online nodes and packet volume over time, aggregated into hourly, 6-hour, or daily windows depending on the
          selected range. New nodes are always shown as daily totals.
        </CardDescription>
        <div className="absolute right-4 top-4">
          <TimeRangeSelect options={MESH_STATS_TIME_OPTIONS} value={timeRangeKey} onChange={handleTimeRangeChange} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <OnlineNodesChart
          title="Online Nodes"
          description="Online nodes (heard within 2h)"
          metric="online_nodes"
          config={onlineNodesOnlyChartConfig}
          embedded
          dateRange={dateRange}
          movingAverage={true}
        />
        <OnlineNodesChart
          title="New Nodes"
          description="Newly discovered nodes per day"
          metric="new_nodes"
          config={newNodesOnlyChartConfig}
          embedded
          dateRange={dateRange}
          movingAverage={false}
        />
        <PacketStatsChartFromSnapshots
          title="Mesh Activity"
          description="Total packets"
          config={packetChartConfig}
          embedded
          dateRange={dateRange}
        />
      </CardContent>
    </Card>
  );
}
