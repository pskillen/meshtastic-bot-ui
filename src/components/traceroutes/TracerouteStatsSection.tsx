import { useMemo, useState } from 'react';
import { subHours, subDays } from 'date-fns';
import { Cell, Legend, Line, LineChart, Pie, PieChart, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useTracerouteStats } from '@/hooks/api/useTraceroutes';

const TR_STATS_TIMEFRAME_OPTIONS = [
  { key: '24h', label: '24 hours' },
  { key: '48h', label: '48 hours' },
  { key: '7d', label: '7 days' },
  { key: '14d', label: '14 days' },
  { key: '30d', label: '30 days' },
] as const;

type TimeframeKey = (typeof TR_STATS_TIMEFRAME_OPTIONS)[number]['key'];

function getTriggeredAtAfter(timeframe: TimeframeKey): Date {
  if (timeframe === '24h') return subHours(new Date(), 24);
  if (timeframe === '48h') return subHours(new Date(), 48);
  if (timeframe === '7d') return subDays(new Date(), 7);
  if (timeframe === '14d') return subDays(new Date(), 14);
  if (timeframe === '30d') return subDays(new Date(), 30);
  return subDays(new Date(), 7);
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#84cc16'];

const SOURCE_LABELS: Record<string, string> = {
  auto: 'Auto',
  user: 'User',
  external: 'External',
};

export function TracerouteStatsSection() {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('7d');
  const triggeredAtAfter = useMemo(() => getTriggeredAtAfter(timeframe), [timeframe]);

  const { data, isLoading, error } = useTracerouteStats({ triggeredAtAfter });

  const sourcesChartData = useMemo(() => {
    if (!data?.sources?.length) return [];
    return data.sources.map((s, idx) => ({
      name: SOURCE_LABELS[s.trigger_type] ?? s.trigger_type,
      value: s.count,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [data?.sources]);

  const successFailureChartData = useMemo(() => {
    if (!data?.success_failure?.length) return [];
    return data.success_failure.map((s) => ({
      name: s.status === 'completed' ? 'Success' : 'Failed',
      value: s.count,
      fill: s.status === 'completed' ? '#22c55e' : '#ef4444',
    }));
  }, [data?.success_failure]);

  const lineChartConfig: ChartConfig = {
    completed: { color: '#22c55e', label: 'Completed' },
    failed: { color: '#ef4444', label: 'Failed' },
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-destructive">
            Failed to load traceroute stats: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Traceroute Statistics</h2>
        <Select value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeKey)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TR_STATS_TIMEFRAME_OPTIONS.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* TR sources pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">TR Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
            ) : sourcesChartData.length > 0 ? (
              <ChartContainer config={{}} className="aspect-auto h-[180px] w-full">
                <PieChart>
                  <Pie
                    data={sourcesChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sourcesChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent formatter={(v) => [v, '']} />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Success/failure pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Success / Failure</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
            ) : successFailureChartData.length > 0 ? (
              <ChartContainer config={{}} className="aspect-auto h-[180px] w-full">
                <PieChart>
                  <Pie
                    data={successFailureChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {successFailureChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent formatter={(v) => [v, '']} />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Top routers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Routers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
            ) : data?.top_routers?.length ? (
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {data.top_routers.slice(0, 8).map((r) => (
                  <div key={r.node_id} className="flex justify-between items-center gap-2 text-sm">
                    <span className="truncate font-mono" title={r.short_name}>
                      {r.short_name || r.node_id_str}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{r.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Success over time (14d line) */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Success Over Time (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
            ) : data?.success_over_time?.length ? (
              <ChartContainer config={lineChartConfig} className="aspect-auto h-[180px] w-full">
                <LineChart data={data.success_over_time} margin={{ top: 4, right: 4, bottom: 20, left: 4 }}>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                    }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tickLine={false} axisLine={false} width={28} tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => [v, '']}
                        labelFormatter={(l) => new Date(l).toLocaleDateString()}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  <Legend />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
