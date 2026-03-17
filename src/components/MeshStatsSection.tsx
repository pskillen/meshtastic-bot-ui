'use client';

import * as React from 'react';
import { subDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { OnlineNodesChart } from '@/components/OnlineNodesChart';
import { PacketStatsChartFromSnapshots } from '@/components/PacketStatsChartFromSnapshots';
import { ChartConfig } from '@/components/ui/chart';

const MESH_STATS_TIME_OPTIONS: TimeRangeOption[] = [
  { key: '48h', label: 'Last 48 hours' },
  { key: '1d', label: 'Today' },
  { key: '2d', label: 'Last 2 days' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
];

const onlineNodesChartConfig = {
  value: {
    label: 'Online nodes',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const packetChartConfig = {
  value: {
    label: 'Packets',
    color: 'hsl(var(--chart-2))',
  },
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
          Online nodes and packet volume over time. Longer ranges are aggregated into 6-hour or daily windows.
        </CardDescription>
        <div className="absolute right-4 top-4">
          <TimeRangeSelect options={MESH_STATS_TIME_OPTIONS} value={timeRangeKey} onChange={handleTimeRangeChange} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <OnlineNodesChart
          title="Online Nodes"
          description="Online nodes (heard within 2h)"
          config={onlineNodesChartConfig}
          embedded
          dateRange={dateRange}
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
