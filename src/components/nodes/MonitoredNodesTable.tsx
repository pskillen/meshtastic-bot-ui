import { NodeData } from '@/lib/models';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface MonitoredNodesTableProps {
  nodes: NodeData[];
  onRemoveNode: (nodeId: number) => void;
}

export function MonitoredNodesTable({ nodes, onRemoveNode }: MonitoredNodesTableProps) {
  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Short Name</TableHead>
            <TableHead>Long Name</TableHead>
            <TableHead>Last Heard</TableHead>
            <TableHead>Battery</TableHead>
            <TableHead>Position</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node) => (
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
                <div className="space-y-1">
                  <div>
                    {node.latest_device_metrics?.battery_level ? `${node.latest_device_metrics.battery_level}%` : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {node.latest_device_metrics?.voltage ? `${node.latest_device_metrics.voltage.toFixed(2)}V` : '-'}
                  </div>
                  {node.latest_device_metrics?.reported_time && (
                    <div className="text-xs text-muted-foreground">
                      Updated: {node.latest_device_metrics.reported_time.toLocaleString()}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {node.latest_position ? (
                  <div className="space-y-1">
                    <div>
                      {node.latest_position.latitude.toFixed(6)}, {node.latest_position.longitude.toFixed(6)}
                    </div>
                    {node.latest_position.reported_time && (
                      <div className="text-xs text-muted-foreground">
                        Updated: {node.latest_position.reported_time.toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onRemoveNode(node.node_id)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
