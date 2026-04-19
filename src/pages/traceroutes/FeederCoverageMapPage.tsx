import { useCallback, useMemo, useState } from 'react';

import { subDays, subHours } from 'date-fns';
import { ChevronDownIcon, CircleDashedIcon, FilterIcon, XIcon } from 'lucide-react';

import { FeederCoverageMap } from '@/components/traceroutes/FeederCoverageMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  useFeederRanges,
  type FeederRange,
  type FeederRangeMetric,
  type FeederRangeMode,
} from '@/hooks/api/useFeederRanges';

type TimeRange = '24h' | '7d' | '30d';

const METRIC_LABELS: Record<FeederRangeMetric, string> = {
  p50: '50%',
  p90: '90%',
  p95: '95%',
  max: 'max',
};

function metricDescription(metric: FeederRangeMetric, mode: FeederRangeMode): string {
  const modeLabel = mode === 'direct' ? 'direct-only' : 'any-path';
  if (metric === 'max') {
    return `Circle = furthest successful ${modeLabel} TR target.`;
  }
  const pct = metric === 'p50' ? '50%' : metric === 'p90' ? '90%' : '95%';
  return `Circle = radius containing ${pct} of successful ${modeLabel} TR targets.`;
}

function feederLabel(f: FeederRange): string {
  if (f.short_name && f.long_name) return `${f.short_name} — ${f.long_name}`;
  return f.short_name || f.long_name || f.node_id_str;
}

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
        <div className="pt-1 text-xs text-muted-foreground">{metricDescription(metric, mode)}</div>
        <div className="pt-2 text-xs italic text-muted-foreground">
          Not &ldquo;{metric === 'max' ? '100%' : METRIC_LABELS[metric]} of attempts succeed at this range&rdquo;.
          Round-trip; lower bound on real reach. Experimental.
        </div>
      </CardContent>
    </Card>
  );
}

function FeederFilterDropdown({
  feeders,
  selected,
  onChange,
}: {
  feeders: FeederRange[];
  selected: Set<string> | null;
  onChange: (next: Set<string> | null) => void;
}) {
  const sorted = useMemo(
    () => [...feeders].sort((a, b) => feederLabel(a).localeCompare(feederLabel(b), undefined, { sensitivity: 'base' })),
    [feeders]
  );
  const isAll = selected === null;
  const selectedCount = selected?.size ?? feeders.length;

  const triggerLabel = isAll
    ? `All feeders (${feeders.length})`
    : selectedCount === 0
      ? 'No feeders'
      : `${selectedCount} of ${feeders.length} feeders`;

  const toggle = (id: string, checked: boolean) => {
    // Lazily materialise the explicit set when the user first deviates from "all".
    const base = selected ? new Set(selected) : new Set(sorted.map((f) => f.managed_node_id));
    if (checked) base.add(id);
    else base.delete(id);
    onChange(base);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2" disabled={feeders.length === 0}>
          <FilterIcon className="h-3.5 w-3.5" />
          <span className="text-xs">{triggerLabel}</span>
          <ChevronDownIcon className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[60vh] w-72">
        <div className="flex items-center justify-between px-2 pb-1 pt-0.5">
          <DropdownMenuLabel className="px-0 py-0 text-xs uppercase text-muted-foreground">Feeders</DropdownMenuLabel>
          <div className="flex gap-2 text-xs">
            <button type="button" className="text-emerald-600 hover:underline" onClick={() => onChange(null)}>
              All
            </button>
            <button type="button" className="text-muted-foreground hover:underline" onClick={() => onChange(new Set())}>
              None
            </button>
          </div>
        </div>
        <DropdownMenuSeparator />
        {sorted.length === 0 && <div className="px-2 py-2 text-xs text-muted-foreground">No feeders in window.</div>}
        {sorted.map((f) => {
          const checked = isAll || (selected?.has(f.managed_node_id) ?? false);
          return (
            <DropdownMenuCheckboxItem
              key={f.managed_node_id}
              checked={checked}
              onCheckedChange={(c) => toggle(f.managed_node_id, Boolean(c))}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="truncate text-xs">{feederLabel(f)}</span>
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FeederCoverageMapPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [metric, setMetric] = useState<FeederRangeMetric>('p95');
  const [mode, setMode] = useState<FeederRangeMode>('direct');
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [minSamples, setMinSamples] = useState(10);
  // null = "all feeders" (the default); a Set means the user has opted into an explicit selection.
  const [selectedFeederIds, setSelectedFeederIds] = useState<Set<string> | null>(null);

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

  const filteredFeeders = useMemo(() => {
    if (selectedFeederIds === null) return feeders;
    return feeders.filter((f) => selectedFeederIds.has(f.managed_node_id));
  }, [feeders, selectedFeederIds]);

  const visibleCount = useMemo(() => {
    return filteredFeeders.filter((f) => {
      const block = mode === 'direct' ? f.direct : f.any;
      if (block.sample_count === 0) return false;
      if (!showLowConfidence && block.low_confidence) return false;
      return true;
    }).length;
  }, [filteredFeeders, mode, showLowConfidence]);
  const lowConfidenceCount = useMemo(() => {
    return filteredFeeders.filter((f) => {
      const block = mode === 'direct' ? f.direct : f.any;
      return block.sample_count > 0 && block.low_confidence;
    }).length;
  }, [filteredFeeders, mode]);

  const clearFeederFilter = useCallback(() => setSelectedFeederIds(null), []);

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
              Range covers
            </Label>
            <ToggleGroup
              id="coverage-metric"
              type="single"
              size="sm"
              value={metric}
              onValueChange={(v) => v && setMetric(v as FeederRangeMetric)}
              aria-label="Range covers"
            >
              <ToggleGroupItem value="p50" aria-label="50% of successes">
                50%
              </ToggleGroupItem>
              <ToggleGroupItem value="p90" aria-label="90% of successes">
                90%
              </ToggleGroupItem>
              <ToggleGroupItem value="p95" aria-label="95% of successes">
                95%
              </ToggleGroupItem>
              <ToggleGroupItem value="max" aria-label="Furthest success">
                max
              </ToggleGroupItem>
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
          <Label htmlFor="coverage-feeders" className="text-xs">
            Feeders
          </Label>
          <FeederFilterDropdown feeders={feeders} selected={selectedFeederIds} onChange={setSelectedFeederIds} />
          {selectedFeederIds !== null && (
            <button
              type="button"
              onClick={clearFeederFilter}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Clear feeder filter"
            >
              <XIcon className="h-3 w-3" /> reset
            </button>
          )}
        </div>
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
              <FeederCoverageMap
                feeders={filteredFeeders}
                metric={metric}
                mode={mode}
                showLowConfidence={showLowConfidence}
              />
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
