import { useNodes } from '@/lib/hooks/useNodes';
import { subHours } from 'date-fns';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NodeCard } from '@/components/nodes/NodeCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SortOption = "last_heard" | "name";

export function NodesList() {
  const { nodes, isLoading, error } = useNodes();
  const [hoursThreshold, setHoursThreshold] = useState("2");
  const [sortBy, setSortBy] = useState<SortOption>("last_heard");
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error instanceof Error ? error.message : 'Failed to fetch nodes'}</div>
      </div>
    );
  }

  const now = new Date();
  const threshold = subHours(now, Number(hoursThreshold));

  const sortNodes = (nodes: any[]) => {
    return [...nodes].sort((a, b) => {
      if (sortBy === "last_heard") {
        if (!a.last_heard) return 1;
        if (!b.last_heard) return -1;
        return new Date(b.last_heard).getTime() - new Date(a.last_heard).getTime();
      } else {
        return a.long_name.localeCompare(b.long_name);
      }
    });
  };

  const filterNodes = (nodes: any[]) => {
    if (!searchQuery) return nodes;
    
    const query = searchQuery.toLowerCase();
    return nodes.filter(node => 
      node.long_name?.toLowerCase().includes(query) ||
      node.short_name?.toLowerCase().includes(query) ||
      node.node_id?.toLowerCase().includes(query)
    );
  };

  const onlineNodes = sortNodes(filterNodes(nodes?.filter(node => 
    node.last_heard && new Date(node.last_heard) > threshold
  ) || []));
  
  const offlineNodes = sortNodes(filterNodes(nodes?.filter(node => 
    !node.last_heard || new Date(node.last_heard) <= threshold
  ) || []));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Meshtastic Nodes</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="hours" className="text-sm text-gray-600">Online threshold (hours):</label>
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
            <ToggleGroup type="single" value={sortBy} onValueChange={(value) => value && setSortBy(value as SortOption)}>
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

      <Accordion type="single" collapsible defaultValue="online" className="space-y-4">
        <AccordionItem value="online">
          <AccordionTrigger>
            Online Nodes ({onlineNodes.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {onlineNodes.map((node) => (
                <NodeCard key={node.id} node={node} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="offline">
          <AccordionTrigger>
            Offline Nodes ({offlineNodes.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offlineNodes.map((node) => (
                <NodeCard key={node.id} node={node} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
} 