import { NodeActivityTable } from '@/components/NodeActivityTable';
import { NodesAndConstellationsMap } from '@/components/nodes/NodesAndConstellationsMap';
import { useNodesSuspense, useManagedNodesSuspense, useRecentNodeCountsSuspense } from '@/hooks/api/useNodes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Suspense, useMemo } from 'react';
import { filterManagedNodesForMapDisplay } from '@/lib/managed-node-status';
import { MeshStatsSection } from '@/components/MeshStatsSection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';

const COUNT_COLUMNS = [
  { key: '2', label: '2 hours' },
  { key: '24', label: '24h' },
  { key: '168', label: '7 days' },
  { key: '720', label: '30 days' },
  { key: '2160', label: '90 days' },
  { key: 'all', label: 'All time' },
] as const;

function DashboardContent() {
  const counts = useRecentNodeCountsSuspense();
  const { nodes } = useNodesSuspense();
  const { managedNodes } = useManagedNodesSuspense({ includeStatus: true });
  const managedNodesForMap = useMemo(() => filterManagedNodesForMapDisplay(managedNodes), [managedNodes]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6" data-testid="dashboard-recently-active-nodes">
        <Card>
          <CardHeader>
            <CardTitle>Recently Active Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {COUNT_COLUMNS.map((col) => (
                    <TableHead key={col.key} className="text-center">
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {COUNT_COLUMNS.map((col) => (
                    <TableCell key={col.key} className="text-center font-mono tabular-nums">
                      {counts[col.key] ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="px-4 lg:px-6" data-testid="dashboard-meshflow-map">
        <Card>
          <CardHeader>
            <CardTitle>Meshflow Map</CardTitle>
            <CardDescription>
              <p>
                Constellations represent local regions on the mesh. Below is a map of nodes which report into Meshflow.
              </p>
              <p>
                Click on a node to view more information about it. View the <Link to="nodes">Nodes page</Link> for a
                list of all nodes.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] w-full">
              <NodesAndConstellationsMap
                managedNodes={managedNodesForMap}
                showConstellation={true}
                showUnmanagedNodes={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="px-4 lg:px-6">
        <MeshStatsSection />
      </div>
      <div className="px-4 lg:px-6" data-testid="dashboard-node-activity">
        <NodeActivityTable nodes={nodes || []} />
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
