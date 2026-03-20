import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-slate-50 dark:bg-slate-900">
        <SiteHeader />
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="@container/main flex min-h-0 flex-1 flex-col gap-2">
            <Outlet />
          </div>
          <SiteFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
