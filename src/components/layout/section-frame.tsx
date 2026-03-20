import * as React from 'react';

import { cn } from '@/lib/utils';

/** Outer section frame — raised band around a block (see docs/STYLEGUIDE.md). */
export function SectionFrame({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-slate-400 bg-slate-200 shadow-sm shadow-slate-900/10 dark:border-slate-500 dark:bg-slate-800 dark:shadow-md dark:shadow-black/40',
        className
      )}
      {...props}
    />
  );
}

/** Nested inset — canvas-matched well for tables, maps, chart stacks. */
export function SectionInset({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-slate-400 bg-slate-50 dark:border-slate-600 dark:bg-slate-900',
        className
      )}
      {...props}
    />
  );
}

/** Transparent Card shell when the section frame already provides the surface. */
export const sectionCardShellClassName = 'border-0 bg-transparent shadow-none';

/** Table in inset: header band contrast (STYLEGUIDE — data tables in insets). */
export const dashboardTableHeaderClassName =
  '[&_th]:bg-slate-200 dark:[&_th]:bg-slate-700 [&_tr]:border-b-2 [&_tr]:border-slate-400 dark:[&_tr]:border-slate-600';

/** Stronger row rules for dense tables. */
export const dashboardTableRowClassName = 'border-b-2 border-slate-300 dark:border-slate-600';
