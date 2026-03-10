import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { SiteBreadcrumb } from '@/components/SiteBreadcrumb';

export function SiteHeader() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b border-slate-200 dark:border-slate-700 transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center flex-1 min-w-0 gap-2">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4 shrink-0" />
          <h1 className="text-base font-semibold font-header shrink-0">MeshFlow</h1>
          <SiteBreadcrumb />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
