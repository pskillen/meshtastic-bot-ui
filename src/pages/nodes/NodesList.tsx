import { useNodesSuspense, useManagedNodesSuspense } from '@/hooks/api/useNodes';
import { subDays, subHours } from 'date-fns';
import { useMemo, useState, Suspense } from 'react';
import { NodeCard } from '@/components/nodes/NodeCard';
import { NodesAndConstellationsMap } from '@/components/nodes/NodesAndConstellationsMap';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  SectionFrame,
  SectionInset,
  searchFieldShellClassName,
  searchInputUnstyledClassName,
  sectionCardShellClassName,
} from '@/components/layout/section-frame';
import { ObservedNode } from '@/lib/models';

type TimeRangeOption = '2h' | '24h' | '7d' | '30d' | 'all';
type SortOption = 'last_heard' | 'name';

const TIME_RANGE_OPTIONS: { value: TimeRangeOption; label: string }[] = [
  { value: '2h', label: '2 hours' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
];

function getLastHeardAfter(timeRange: TimeRangeOption): Date | undefined {
  if (timeRange === 'all') return undefined;
  const now = new Date();
  switch (timeRange) {
    case '2h':
      return subHours(now, 2);
    case '24h':
      return subHours(now, 24);
    case '7d':
      return subDays(now, 7);
    case '30d':
      return subDays(now, 30);
    default:
      return subDays(now, 7);
  }
}

function NodesListContent() {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('7d');
  const [sortBy, setSortBy] = useState<SortOption>('last_heard');
  const [searchQuery, setSearchQuery] = useState('');

  const lastHeardAfter = useMemo(() => getLastHeardAfter(timeRange), [timeRange]);

  // Main list: nodes in selected time range
  const {
    nodes: mainListNodes,
    totalNodes,
    fetchNextPage,
    hasNextPage,
  } = useNodesSuspense({
    lastHeardAfter,
    pageSize: 100,
  });

  const { managedNodes } = useManagedNodesSuspense(500);

  const sortNodes = (nodes: ObservedNode[]) => {
    return [...nodes].sort((a, b) => {
      if (sortBy === 'last_heard') {
        if (!a.last_heard) return 1;
        if (!b.last_heard) return -1;
        return b.last_heard.getTime() - a.last_heard.getTime();
      } else {
        const aName = a.long_name || '';
        const bName = b.long_name || '';
        return aName.localeCompare(bName);
      }
    });
  };

  const filterNodes = (nodes: ObservedNode[]) => {
    if (!searchQuery) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(
      (node) =>
        node.long_name?.toLowerCase().includes(query) ||
        node.short_name?.toLowerCase().includes(query) ||
        node.node_id_str?.toLowerCase().includes(query)
    );
  };

  const displayedNodes = sortNodes(filterNodes(mainListNodes || []));

  // Map nodes: same as main list, filtered by time range and search
  const mapNodes = searchQuery ? filterNodes(mainListNodes || []) : mainListNodes || [];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-header text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Meshtastic Nodes
          </h1>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="time-range" className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Time range
              </label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRangeOption)}>
                <SelectTrigger
                  className="w-[180px] border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950"
                  id="time-range"
                  aria-label="Select time range"
                >
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Sort by</span>
              <ToggleGroup
                type="single"
                value={sortBy}
                onValueChange={(value) => value && setSortBy(value as SortOption)}
              >
                <ToggleGroupItem value="last_heard" aria-label="Sort by last heard">
                  Last Heard
                </ToggleGroupItem>
                <ToggleGroupItem value="name" aria-label="Sort by name">
                  Name
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className={`relative ${searchFieldShellClassName}`}>
          <Input
            type="text"
            placeholder="Search nodes by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${searchInputUnstyledClassName} pl-10`}
          />
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            aria-hidden
          />
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <SectionFrame>
          <Card className={sectionCardShellClassName}>
            <CardHeader>
              <CardTitle className="font-header text-lg tracking-tight text-slate-900 dark:text-slate-100">
                Mesh nodes and monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SectionInset className="overflow-hidden p-0">
                <div className="h-[600px] w-full">
                  <NodesAndConstellationsMap
                    managedNodes={managedNodes}
                    observedNodes={mapNodes}
                    showConstellation={true}
                    showUnmanagedNodes={true}
                  />
                </div>
              </SectionInset>
            </CardContent>
          </Card>
        </SectionFrame>
      </div>

      <div className="px-4 lg:px-6">
        <SectionFrame>
          <div className="flex flex-col px-6 pb-6 pt-6">
            <h2 className="font-header text-lg font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100">
              Recent nodes ({displayedNodes.length}
              {totalNodes > displayedNodes.length ? ` of ${totalNodes}` : ''})
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedNodes.map((node) => (
                <NodeCard key={node.internal_id} node={node} />
              ))}
            </div>
            {hasNextPage && (
              <div className="mt-6 flex justify-center border-t border-slate-400/60 pt-6 dark:border-slate-500/60">
                <Button variant="outline" className="border-2" onClick={() => fetchNextPage()}>
                  Load more
                </Button>
              </div>
            )}
          </div>
        </SectionFrame>
      </div>
    </div>
  );
}

export function NodesList() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div
            className="h-12 w-12 animate-spin rounded-full border-2 border-teal-600 border-t-transparent dark:border-teal-400 dark:border-t-transparent"
            aria-hidden
          />
        </div>
      }
    >
      <NodesListContent />
    </Suspense>
  );
}
