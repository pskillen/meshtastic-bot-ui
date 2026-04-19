import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { subDays, subHours } from 'date-fns';
import { CircleDashedIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConstellations } from '@/hooks/api/useConstellations';
import { useConstellationCoverage } from '@/hooks/api/useConstellationCoverage';
import { ConstellationCoverageMap } from '@/components/traceroutes/ConstellationCoverageMap';

type TimeRange = '24h' | '7d' | '30d';

function smoothedRate(successes: number, attempts: number): number {
  return (successes + 1) / (attempts + 2);
}

function StatsCard({
  hexCount,
  totalAttempts,
  totalSuccesses,
  meanSmoothed,
  minAttempts,
  className,
}: {
  hexCount: number;
  totalAttempts: number;
  totalSuccesses: number;
  meanSmoothed: number | null;
  minAttempts: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Coverage stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div>{hexCount.toLocaleString()} hexes</div>
        <div>
          {totalSuccesses.toLocaleString()} / {totalAttempts.toLocaleString()} attempts succeeded
        </div>
        {meanSmoothed != null && <div>Mean smoothed reliability: {(meanSmoothed * 100).toFixed(1)}%</div>}
        <div className="pt-2 text-xs text-muted-foreground">Min attempts floor: {minAttempts}</div>
        <div className="pt-2">
          <div className="mb-1 text-xs text-muted-foreground">Smoothed reliability</div>
          <div
            className="h-2 w-full rounded"
            style={{
              background: 'linear-gradient(to right, #ef4444, #f59e0b 50%, #22c55e)',
            }}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConstellationCoveragePage() {
  const { constellationId: constellationIdParam } = useParams();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [minAttempts, setMinAttempts] = useState<number>(3);
  const [h3Resolution, setH3Resolution] = useState<number>(6);

  const { constellations, isLoading: constellationsLoading } = useConstellations(100, true);

  const constellationIdNum = constellationIdParam ? Number.parseInt(constellationIdParam, 10) : undefined;

  // If no constellation in URL, redirect to the first one we can see (mirrors Dashboard behaviour).
  useEffect(() => {
    if (constellationIdParam) return;
    if (constellationsLoading) return;
    const first = constellations[0];
    if (!first) return;
    navigate(`/traceroutes/map/coverage/constellation/${first.id}`, { replace: true });
  }, [constellationIdParam, constellationsLoading, constellations, navigate]);

  const triggeredAtAfter = useMemo(() => {
    if (timeRange === '24h') return subHours(new Date(), 24);
    if (timeRange === '7d') return subDays(new Date(), 7);
    return subDays(new Date(), 30);
  }, [timeRange]);

  const { data, isLoading, error } = useConstellationCoverage({
    constellationId: Number.isFinite(constellationIdNum) ? constellationIdNum : undefined,
    triggeredAtAfter,
    h3Resolution,
  });

  const filteredHexes = useMemo(
    () => (data?.hexes ?? []).filter((h) => h.attempts >= minAttempts),
    [data, minAttempts]
  );

  const totalAttempts = filteredHexes.reduce((acc, h) => acc + h.attempts, 0);
  const totalSuccesses = filteredHexes.reduce((acc, h) => acc + h.successes, 0);
  const meanSmoothed = filteredHexes.length
    ? filteredHexes.reduce((acc, h) => acc + smoothedRate(h.successes, h.attempts), 0) / filteredHexes.length
    : null;

  return (
    <div className="flex min-h-[50vh] flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CircleDashedIcon className="h-6 w-6" />
          <h1 className="text-xl font-semibold sm:text-2xl">Constellation coverage</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3" data-testid="constellation-coverage-filters">
          <Link
            to="/traceroutes/map/coverage"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Per-feeder view
          </Link>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground" htmlFor="constellation-coverage-constellation">
              Constellation
            </Label>
            <Select
              value={constellationIdParam}
              onValueChange={(v) => navigate(`/traceroutes/map/coverage/constellation/${v}`)}
              disabled={constellationsLoading || constellations.length === 0}
            >
              <SelectTrigger
                id="constellation-coverage-constellation"
                className="min-w-[200px]"
                aria-label="Select constellation"
              >
                <SelectValue placeholder="Select constellation" />
              </SelectTrigger>
              <SelectContent>
                {constellations.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground" htmlFor="constellation-coverage-window">
              Window
            </Label>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger id="constellation-coverage-window" className="min-w-[140px]" aria-label="Time window">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground" htmlFor="constellation-coverage-resolution">
              H3 resolution
            </Label>
            <Select value={String(h3Resolution)} onValueChange={(v) => setH3Resolution(Number.parseInt(v, 10))}>
              <SelectTrigger
                id="constellation-coverage-resolution"
                className="min-w-[100px]"
                aria-label="H3 resolution"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 (~9km)</SelectItem>
                <SelectItem value="6">6 (~3km)</SelectItem>
                <SelectItem value="7">7 (~1.2km)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground" htmlFor="constellation-coverage-min-attempts">
              Min attempts
            </Label>
            <Input
              id="constellation-coverage-min-attempts"
              type="number"
              min={1}
              value={minAttempts}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value, 10);
                setMinAttempts(Number.isFinite(v) && v >= 1 ? v : 1);
              }}
              className="w-20"
            />
          </div>
        </div>
      </div>

      <div className="block md:hidden">
        <StatsCard
          hexCount={filteredHexes.length}
          totalAttempts={totalAttempts}
          totalSuccesses={totalSuccesses}
          meanSmoothed={meanSmoothed}
          minAttempts={minAttempts}
        />
      </div>

      <div
        className="relative flex-1 min-h-[300px] md:min-h-[calc(100dvh-16rem)]"
        data-testid="constellation-coverage-map"
      >
        <Card className="h-full min-h-[300px]">
          <CardContent className="h-full p-0">
            {error && (
              <div className="flex h-full min-h-[300px] items-center justify-center text-destructive">
                Failed to load coverage: {error instanceof Error ? error.message : 'Unknown error'}
              </div>
            )}
            {isLoading && (
              <div className="flex h-full min-h-[300px] items-center justify-center text-muted-foreground">
                Loading coverage…
              </div>
            )}
            {!error && !isLoading && data && (
              <ConstellationCoverageMap hexes={filteredHexes} minAttempts={minAttempts} />
            )}
          </CardContent>
        </Card>

        <div className="absolute right-4 top-4 z-10 hidden md:block">
          <StatsCard
            className="w-64"
            hexCount={filteredHexes.length}
            totalAttempts={totalAttempts}
            totalSuccesses={totalSuccesses}
            meanSmoothed={meanSmoothed}
            minAttempts={minAttempts}
          />
        </div>
      </div>
    </div>
  );
}
