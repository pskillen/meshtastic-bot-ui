import { NodeData } from '@/lib/models';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface NodeSelectorProps {
  nodes: NodeData[];
  onSelect: (nodeId: number) => void;
  onCancel: () => void;
  excludeNodes?: number[];
}

export function NodeSelector({ nodes, onSelect, onCancel, excludeNodes = [] }: NodeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const availableNodes = nodes
    .filter((node) => !excludeNodes.includes(node.node_id))
    .filter((node) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        node.long_name?.toLowerCase().includes(query) ||
        node.short_name?.toLowerCase().includes(query) ||
        node.node_id_str.toLowerCase().includes(query)
      );
    });

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Node to Monitor</DialogTitle>
          <DialogDescription>
            Choose a node from the list below to add it to your monitoring dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short Name</TableHead>
                <TableHead>Long Name</TableHead>
                <TableHead>Last Heard</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableNodes.map((node) => (
                <TableRow key={node.node_id}>
                  <TableCell>
                    <div>
                      {node.short_name || node.node_id_str}
                      <div className="text-xs text-muted-foreground">{node.node_id_str}</div>
                    </div>
                  </TableCell>
                  <TableCell>{node.long_name || '-'}</TableCell>
                  <TableCell>{node.last_heard ? node.last_heard.toLocaleString() : 'Never'}</TableCell>
                  <TableCell>
                    {node.latest_device_metrics?.battery_level ? `${node.latest_device_metrics.battery_level}%` : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="secondary" size="sm" onClick={() => onSelect(node.node_id)}>
                      Monitor
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
