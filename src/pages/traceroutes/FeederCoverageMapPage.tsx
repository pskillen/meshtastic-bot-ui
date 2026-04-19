import { useMemo, useState } from 'react';

import { subDays, subHours } from 'date-fns';
import { CircleDashedIcon } from 'lucide-react';

import { FeederCoverageMap } from '@/components/traceroutes/FeederCoverageMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFeederRanges, type FeederRangeMetric, type FeederRangeMode } from '@/hooks/api/useFeederRanges';

type TimeRange = '24h' | '7d' | '30d';

function CoverageStatsCard({
  feederCount,
  lowConfidenceCount,
  metric,
  mode,
  className,
}: {
  feederCount: number;
  lowConfidenceCount: number;
  metric: FeederRangeMetric;
  mode: FeederRangeMode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Coverage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>Feeders shown: {feederCount.toLocaleString()}</div>
        <div>Low confidence: {lowConfidenceCount.toLocaleString()}</div>
        <div className="pt-1 text-xs text-muted-foreground">
          Showing {metric.toUpperCase()} of {mode === 'direct' ? 'direct-only' : 'any-path'} TR distances per feeder.
        </div>
        <div className="pt-2 text-xs italic text-muted-foreground">
          Round-trip range. Lower bound on real reach. Experimental.
        </div>
      </CardContent>
    </Card>
  );
}

export function FeederCoverageMapPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [metric, setMetric] = useState<FeederRangeMetric>('p95');
  const [mode, setMode] = useState<FeederRangeMode>('direct');
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [minSamples, setMinSamples] = useState(10);

  const triggeredAtAfter = useMemo(() => {
    if (timeRange === '24h') return subHours(new Date(), 24);
    if (timeRange === '7d') return subDays(new Date(), 7);
    if (timeRange === '30d') return subDays(new Date(), 30);
    return undefined;
  }, [timeRange]);

  const { data, isLoading, error } = useFeederRanges({
    triggeredAtAfter,
    minSamples,
  });

  const feeders = useMemo(() => data?.feeders ?? [], [data?.feeders]);
  const visibleCount = useMemo(() => {
    return feeders.filter((f) => {
      const block = mode === 'direct' ? f.direct : f.any;
      if (block.sample_count === 0) return false;
      if (!showLowConfidence && block.low_confidence) return false;
      return true;
    }).length;
  }, [feeders, mode, showLowConfidence]);
  const lowConfidenceCount = useMemo(() => {
    return feeders.filter((f) => {
      const block = mode === 'direct' ? f.direct : f.any;
      return block.sample_count > 0 && block.low_confidence;
    }).length;
  }, [feeders, mode]);

  return (
    <div className="flex min-h-[50vh] flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CircleDashedIcon className="h-6 w-6" />
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Feeder Coverage</h1>
            <p className="text-xs text-muted-foreground">
              Experimental: per-feeder distance percentile of successful traceroute targets.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3" data-testid="coverage-filters">
          <div className="flex items-center gap-2">
            <Label className="text-xs uppercase text-muted-foreground" htmlFor="coverage-metric">
              Metric
            </Label>
            <ToggleGroup
              id="coverage-metric"
              type="single"
              size="sm"
              value={metric}
              onValueChange={(v) => v && setMetric(v as FeederRangeMetric)}
            >
              <ToggleGroupItem value="p50">p50</ToggleGroupItem>
              <ToggleGroupItem value="p90">p90</ToggleGroupItem>
              <ToggleGroupItem value="p95">p95</ToggleGroupItem>
              <ToggleGroupItem value="max">max</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs uppercase text-muted-foreground" htmlFor="coverage-mode">
              Mode
            </Label>
            <ToggleGroup
              id="coverage-mode"
              type="single"
              size="sm"
              value={mode}
              onValueChange={(v) => v && setMode(v as FeederRangeMode)}
            >
              <ToggleGroupItem value="direct">Direct only</ToggleGroupItem>
              <ToggleGroupItem value="any">Any path</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm" data-testid="coverage-advanced">
        <div className="flex items-center gap-2">
          <Label htmlFor="coverage-low-conf" className="text-xs">
            Show low-confidence
          </Label>
          <Switch id="coverage-low-conf" checked={showLowConfidence} onCheckedChange={setShowLowConfidence} />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="coverage-min-samples" className="text-xs">
            Min samples
          </Label>
          <Input
            id="coverage-min-samples"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            value={minSamples}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next) && next >= 1) setMinSamples(Math.floor(next));
            }}
            className="h-8 w-20"
          />
        </div>
      </div>

      <div className="block md:hidden">
        <CoverageStatsCard
          feederCount={visibleCount}
          lowConfidenceCount={lowConfidenceCount}
          metric={metric}
          mode={mode}
        />
      </div>

      <div className="relative flex-1 min-h-[300px] md:min-h-[calc(100dvh-20rem)]" data-testid="coverage-map">
        <Card className="h-full min-h-[300px]">
          <CardContent className="h-full p-0">
            {error && (
              <div className="flex h-full min-h-[300px] items-center justify-center text-destructive">
                Failed to load feeder ranges: {error instanceof Error ? error.message : 'Unknown error'}
              </div>
            )}
            {isLoading && (
              <div className="flex h-full min-h-[300px] items-center justify-center text-muted-foreground">
                Loading feeder coverage...
              </div>
            )}
            {!error && !isLoading && (
              <FeederCoverageMap feeders={feeders} metric={metric} mode={mode} showLowConfidence={showLowConfidence} />
            )}
          </CardContent>
        </Card>

        <div className="absolute right-4 top-4 z-10 hidden md:block">
          <CoverageStatsCard
            feederCount={visibleCount}
            lowConfidenceCount={lowConfidenceCount}
            metric={metric}
            mode={mode}
            className="w-60"
          />
        </div>
      </div>
    </div>
  );
}
