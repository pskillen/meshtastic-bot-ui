import { useState, useMemo, useCallback } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Button } from '@/components/ui/button';
import { useNodes } from '@/lib/hooks/useNodes';

interface TimeRange {
  label: string;
  value: string;
}

const timeRanges: TimeRange[] = [
  { label: '24 hours', value: '24h' },
  { label: '48 hours', value: '48h' },
  { label: 'Today', value: '1d' },
  { label: '2 days', value: '2d' },
  { label: '7 days', value: '7d' },
  { label: '14 days', value: '14d' },
];

interface BatteryChartProps {
  nodeId: number;
}

function getDateRangeFromTimeRange(timeRange: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let start = new Date();
  const timeNumber = parseInt(timeRange.substring(0, timeRange.length - 1));
  const unit = timeRange.substring(timeRange.length - 1);

  if (unit === 'd') {
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (timeNumber - 1));
  } else {
    start = new Date(now.getTime() - timeNumber * 60 * 60 * 1000);
  }

  return { startDate: start, endDate: now };
}

export function BatteryChart({ nodeId }: BatteryChartProps) {
  const [selectedRange, setSelectedRange] = useState('48h');
  const { useNodeMetrics } = useNodes();

  const dateRange = useMemo(() => getDateRangeFromTimeRange(selectedRange), [selectedRange]);
  const metricsQuery = useNodeMetrics(nodeId, dateRange);

  const handleRangeChange = useCallback((range: string) => {
    setSelectedRange(range);
  }, []);

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: 'line' as const,
        height: 400,
        background: 'transparent',
        foreColor: '#ccc',
        zoom: { enabled: true },
      },
      stroke: {
        width: [2, 2, 0, 0],
        curve: 'smooth' as const,
      },
      markers: {
        size: [3, 3, 5, 5],
        opacity: 0.6,
        strokeWidth: 0,
      },
      xaxis: {
        type: 'datetime' as const,
        title: { text: 'Time' },
        labels: { style: { colors: '#aaa' } },
        min: dateRange.startDate.getTime(),
        max: dateRange.endDate.getTime(),
      },
      yaxis: [
        {
          opposite: true,
          title: { text: 'Voltage (V)', style: { color: '#d0a8ff' } },
          min: 3.0,
          max: 4.2,
          decimalsInFloat: 2,
          labels: { style: { colors: '#aaa' } },
        },
        {
          title: { text: 'Battery/Util (%)', style: { color: '#76d9c4' } },
          min: 0,
          max: 100,
          decimalsInFloat: 1,
          labels: { style: { colors: '#aaa' } },
        },
      ],
      tooltip: {
        theme: 'dark' as const,
        x: { format: 'MMM d, HH:mm' },
      },
      legend: { labels: { colors: '#ddd' } },
      grid: { borderColor: '#444' },
    }),
    [dateRange]
  );

  const series = useMemo(() => {
    if (!metricsQuery.data) return [];

    return [
      {
        name: 'Voltage (V)',
        type: 'line',
        data: metricsQuery.data.map((d) => ({
          x: new Date(d.time).getTime(),
          y: d.voltage,
        })),
        yAxisIndex: 0,
      },
      {
        name: 'Battery Level (%)',
        type: 'line',
        data: metricsQuery.data.map((d) => ({
          x: new Date(d.time).getTime(),
          y: d.battery_level,
        })),
        yAxisIndex: 1,
      },
      {
        name: 'Ch Util (%)',
        type: 'scatter',
        data: metricsQuery.data.map((d) => ({
          x: new Date(d.time).getTime(),
          y: d.chUtil,
        })),
        yAxisIndex: 1,
      },
      {
        name: 'Air Util Tx (%)',
        type: 'scatter',
        data: metricsQuery.data.map((d) => ({
          x: new Date(d.time).getTime(),
          y: d.airUtil,
        })),
        yAxisIndex: 1,
      },
    ];
  }, [metricsQuery.data]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {timeRanges.map((range) => (
          <Button
            key={range.value}
            variant={selectedRange === range.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRangeChange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {metricsQuery.isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : metricsQuery.error ? (
        <div className="text-red-500 text-center h-[400px] flex items-center justify-center">
          Failed to load battery data
        </div>
      ) : (
        <ReactApexChart options={chartOptions} series={series} type="line" height={400} />
      )}
    </div>
  );
}
