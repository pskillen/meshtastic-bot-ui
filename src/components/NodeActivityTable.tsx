import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { BatteryIcon, SignalIcon } from 'lucide-react';

import {
  SectionFrame,
  SectionInset,
  dashboardTableHeaderClassName,
  dashboardTableRowClassName,
  sectionCardShellClassName,
} from '@/components/layout/section-frame';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ObservedNode } from '@/lib/models';
import { meshtasticIdToHex } from '@/lib/utils';

const columns: ColumnDef<ObservedNode>[] = [
  {
    accessorKey: 'short_name',
    header: 'Node Name',
    cell: ({ row }) => {
      const node = row.original;
      return (
        <Link to={`/nodes/${node.node_id}`}>
          <div>
            <div className="font-medium">{node.short_name}</div>
            <div className="text-sm text-muted-foreground">{node.long_name}</div>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: 'last_heard',
    header: 'Last Heard',
    cell: ({ row }) => {
      const lastHeard = row.original.last_heard;
      if (!lastHeard) return <span className="text-muted-foreground">Never</span>;

      return (
        <div className="flex items-center gap-2">
          <SignalIcon className="h-4 w-4 text-green-500" />
          <span>{formatDistanceToNow(lastHeard, { addSuffix: true })}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'latest_device_metrics',
    header: 'Battery',
    cell: ({ row }) => {
      const metrics = row.original.latest_device_metrics;
      if (!metrics) return <span className="text-muted-foreground">Unknown</span>;

      const batteryLevel = metrics.battery_level;
      let batteryColor = 'text-red-500';

      if (batteryLevel > 70) {
        batteryColor = 'text-green-500';
      } else if (batteryLevel > 30) {
        batteryColor = 'text-yellow-500';
      }

      return (
        <div className="flex items-center gap-2">
          <BatteryIcon className={`h-4 w-4 ${batteryColor}`} />
          <span>{batteryLevel}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'id',
    header: 'Node ID',
    cell: ({ row }) => {
      return <span className="font-mono text-sm">{meshtasticIdToHex(row.original.node_id)}</span>;
    },
  },
];

interface NodeActivityTableProps {
  nodes: ObservedNode[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
}

export function NodeActivityTable({ nodes, isLoading = false, isLoadingMore = false }: NodeActivityTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'last_heard', desc: true }]);

  const table = useReactTable({
    data: nodes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      sorting: [{ id: 'last_heard', desc: true }],
    },
  });

  return (
    <SectionFrame>
      <Card className={sectionCardShellClassName}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-header text-lg tracking-tight text-slate-900 dark:text-slate-100">
            Node Activity
            {isLoadingMore && (
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent dark:border-teal-400 dark:border-t-transparent"
                aria-hidden
              />
            )}
          </CardTitle>
          <CardDescription>Recent activity from nodes in the network</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent dark:border-teal-400 dark:border-t-transparent" />
            </div>
          ) : (
            <SectionInset className="overflow-hidden p-0">
              <Table>
                <TableHeader className={dashboardTableHeaderClassName}>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className={`${dashboardTableRowClassName} hover:bg-transparent`}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={dashboardTableRowClassName}
                        data-state={row.getIsSelected() && 'selected'}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className={dashboardTableRowClassName}>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No nodes found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end space-x-2 border-t border-slate-200/80 px-4 py-4 dark:border-slate-700/80">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  Next
                </Button>
              </div>
            </SectionInset>
          )}
        </CardContent>
      </Card>
    </SectionFrame>
  );
}
