import { useNodesSuspense } from '@/hooks/api/useNodes';
import { subHours } from 'date-fns';
import { useState, Suspense } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NodeCard } from '@/components/nodes/NodeCard';
import { NodesMap } from '@/components/nodes/NodesMap';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ObservedNode } from '@/lib/models';

type SortOption = 'last_heard' | 'name';

function NodesListContent() {
  const { nodes } = useNodesSuspense();
  const [hoursThreshold, setHoursThreshold] = useState('2');
  const [sortBy, setSortBy] = useState<SortOption>('last_heard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOfflineNodes, setShowOfflineNodes] = useState(true);

  const now = new Date();
  const threshold = subHours(now, Number(hoursThreshold));

  const sortNodes = (nodes: ObservedNode[]) => {
    return [...nodes].sort((a, b) => {
      if (sortBy === 'last_heard') {
        if (!a.last_heard) return 1;
        if (!b.last_heard) return -1;
        return b.last_heard.getTime() - a.last_heard.getTime();
      } else {
        // Handle null values for long_name
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

  const onlineNodes = sortNodes(
    filterNodes(nodes?.filter((node) => node.last_heard && node.last_heard > threshold) || [])
  );

  const offlineNodes = sortNodes(
    filterNodes(nodes?.filter((node) => !node.last_heard || node.last_heard <= threshold) || [])
  );

  // Get nodes to show on map based on search and offline filter
  const mapNodes = searchQuery
    ? [...onlineNodes, ...offlineNodes]
    : showOfflineNodes
      ? nodes || []
      : nodes?.filter((node) => node.last_heard && node.last_heard > threshold) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Meshtastic Nodes</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="hours" className="text-sm text-gray-600">
              Online threshold (hours):
            </label>
            <Select value={hoursThreshold} onValueChange={setHoursThreshold}>
              <SelectTrigger className="w-[180px]" aria-label="Select hours threshold">
                <SelectValue placeholder="Select hours" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 4, 8, 12, 24].map((hours) => (
                  <SelectItem key={hours} value={hours.toString()}>
                    {hours} {hours === 1 ? 'hour' : 'hours'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
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

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search nodes by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Node Locations</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch id="show-offline" checked={showOfflineNodes} onCheckedChange={setShowOfflineNodes} />
            <Label htmlFor="show-offline">Show offline nodes</Label>
          </div>
        </CardHeader>
        <CardContent>
          <NodesMap nodes={mapNodes} />
        </CardContent>
      </Card>

      <Accordion type="single" collapsible defaultValue="online" className="space-y-4">
        <AccordionItem value="online">
          <AccordionTrigger>Online Nodes ({onlineNodes.length})</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {onlineNodes.map((node) => (
                <NodeCard key={node.internal_id} node={node} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="offline">
          <AccordionTrigger>Offline Nodes ({offlineNodes.length})</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offlineNodes.map((node) => (
                <NodeCard key={node.internal_id} node={node} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function NodesList() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <NodesListContent />
    </Suspense>
  );
}
