import { NodeActivityTable } from '@/components/NodeActivityTable';
import { NodesAndConstellationsMap } from '@/components/nodes/NodesAndConstellationsMap';
import {
  SectionFrame,
  SectionInset,
  dashboardTableHeaderClassName,
  dashboardTableRowClassName,
  sectionCardShellClassName,
} from '@/components/layout/section-frame';
import { useNodesSuspense, useManagedNodesSuspense, useRecentNodeCountsSuspense } from '@/hooks/api/useNodes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';
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
  const { managedNodes } = useManagedNodesSuspense();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6" data-testid="dashboard-recently-active-nodes">
        <SectionFrame>
          <Card className={sectionCardShellClassName}>
            <CardHeader>
              <CardTitle className="font-header text-lg tracking-tight text-slate-900 dark:text-slate-100">
                Recently Active Nodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SectionInset className="overflow-hidden">
                <Table>
                  <TableHeader className={dashboardTableHeaderClassName}>
                    <TableRow className={`${dashboardTableRowClassName} hover:bg-transparent`}>
                      {COUNT_COLUMNS.map((col) => (
                        <TableHead key={col.key} className="text-center">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className={dashboardTableRowClassName}>
                      {COUNT_COLUMNS.map((col) => (
                        <TableCell key={col.key} className="text-center font-mono tabular-nums">
                          {counts[col.key] ?? '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </SectionInset>
            </CardContent>
          </Card>
        </SectionFrame>
      </div>
      <div className="px-4 lg:px-6" data-testid="dashboard-meshflow-map">
        <SectionFrame>
          <Card className={sectionCardShellClassName}>
            <CardHeader>
              <CardTitle className="font-header text-lg tracking-tight text-slate-900 dark:text-slate-100">
                Meshflow Map
              </CardTitle>
              <CardDescription>
                <p>
                  Constellations represent local regions on the mesh. Below is a map of nodes which report into
                  Meshflow.
                </p>
                <p>
                  Click on a node to view more information about it. View the{' '}
                  <Link
                    to="/nodes"
                    className="font-medium text-teal-600 underline-offset-4 hover:underline dark:text-teal-400"
                  >
                    Nodes page
                  </Link>{' '}
                  for a list of all nodes.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SectionInset className="overflow-hidden p-0">
                <div className="h-[600px] w-full">
                  <NodesAndConstellationsMap
                    managedNodes={managedNodes || []}
                    showConstellation={true}
                    showUnmanagedNodes={false}
                  />
                </div>
              </SectionInset>
            </CardContent>
          </Card>
        </SectionFrame>
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
        <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div
            className="h-12 w-12 animate-spin rounded-full border-2 border-teal-600 border-t-transparent dark:border-teal-400 dark:border-t-transparent"
            aria-hidden
          />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
