import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { HeatmapNode } from '@/hooks/api/useHeatmapEdges';
import { getHeatmapNodeLabel } from '@/components/traceroutes/heatmapEncoding';

function roleSort(a: HeatmapNode, b: HeatmapNode): number {
  const rank = (r: string | undefined) => (r === 'backbone' ? 0 : r === 'relay' ? 1 : 2);
  const dr = rank(a.role) - rank(b.role);
  if (dr !== 0) return dr;
  const ca = a.centrality ?? 0;
  const cb = b.centrality ?? 0;
  return cb - ca;
}

export function TracerouteHeatmapBackboneRelayTable({ nodes }: { nodes: HeatmapNode[] }) {
  const rows = useMemo(() => nodes.filter((n) => n.role === 'backbone' || n.role === 'relay').sort(roleSort), [nodes]);

  if (rows.length === 0) {
    return (
      <Card data-testid="heatmap-backbone-relay-table">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Backbone and relay nodes</CardTitle>
          <CardDescription>No backbone or relay nodes in this graph for the current filters.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-testid="heatmap-backbone-relay-table">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Backbone and relay nodes</CardTitle>
        <CardDescription>
          Nodes classified from mesh topology (betweenness and degree). Same roles as on the map.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-2 pb-4 pt-0 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Node</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Centrality</TableHead>
              <TableHead className="text-right">Degree</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((n) => (
              <TableRow key={n.node_id}>
                <TableCell>
                  <Link to={`/nodes/${n.node_id}`} className="font-medium text-primary hover:underline">
                    {getHeatmapNodeLabel(n)}
                  </Link>
                  <div className="text-xs text-muted-foreground">{n.node_id_str ?? `!${n.node_id.toString(16)}`}</div>
                </TableCell>
                <TableCell className="capitalize">{n.role}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {n.centrality != null ? `${(n.centrality * 100).toFixed(1)}%` : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">{n.degree ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
