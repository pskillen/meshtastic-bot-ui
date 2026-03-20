import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';

export function SiteHeader() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-[4.5rem] flex min-h-[4.5rem] shrink-0 items-center border-b-2 border-slate-300 bg-slate-50 transition-[width,height] ease-linear dark:border-slate-600 dark:bg-slate-900">
      <div className="flex w-full items-center gap-3 px-4 py-3.5 lg:gap-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
          <SidebarTrigger className="-ml-1 h-10 w-10 shrink-0" />
          <div
            className="hidden h-10 shrink-0 border-l-2 border-slate-300 dark:border-slate-600 sm:block"
            aria-hidden
          />
          <h1 className="shrink-0 font-header text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            MeshFlow
          </h1>
          <SiteBreadcrumb />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="relative h-10 w-10 shrink-0 border-2 border-slate-300 bg-white/90 hover:bg-white dark:border-slate-600 dark:bg-transparent dark:hover:bg-slate-800"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
