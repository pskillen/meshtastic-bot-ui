import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePacketStats } from '@/lib/hooks/usePacketStats';
import { subDays } from 'date-fns';
import { TimeRangeSelect, TimeRangeOption } from '@/components/TimeRangeSelect';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { PacketStatsInterval } from '@/lib/models';

interface PacketTypeChartProps {
  nodeId: number;
  defaultTimeRange?: string;
}

const PACKET_TYPE_COLORS: Record<string, string> = {
  TEXT_MESSAGE_APP: '#3b82f6', // blue-500
  POSITION_APP: '#10b981', // emerald-500
  TELEMETRY_APP: '#f59e0b', // amber-500
  NODEINFO_APP: '#8b5cf6', // violet-500
  ROUTING_APP: '#ec4899', // pink-500
  ADMIN_APP: '#ef4444', // red-500
  OTHER: '#6b7280', // gray-500
};

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { key: '24h', label: '24h' },
  { key: '48h', label: '48h' },
  { key: '7d', label: '7d' },
];

const getInitialDateRange = () => {
  const endDate = new Date();
  const startDate = subDays(endDate, 1);
  return { startDate, endDate };
};

export function PacketTypeChart({ nodeId, defaultTimeRange = '24h' }: PacketTypeChartProps) {
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

    return packetStats.intervals.map((interval) => {
      const timestamp = new Date(interval.start_date).getTime();
      const data: Record<string, number> = { timestamp };

      // Initialize all packet types to 0
      Object.keys(PACKET_TYPE_COLORS).forEach((type) => {
        data[type] = 0;
      });

      // Set the actual counts for each packet type
      (interval as PacketStatsInterval).packet_types.forEach(({ packet_type, count }) => {
        data[packet_type] = count;
      });

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
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
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
          <div className="flex items-center justify-center h-[300px] text-red-500">Error loading packet statistics</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Packet Types</CardTitle>
        <div className="flex items-center gap-2">
          <TimeRangeSelect options={TIME_RANGE_OPTIONS} value={timeRange} onChange={handleTimeRangeChange} />
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                minTickGap={50}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value, name) => [value, name]}
              />
              {Object.entries(PACKET_TYPE_COLORS).map(([type, color]) => (
                <Area
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stackId="1"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.8}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
