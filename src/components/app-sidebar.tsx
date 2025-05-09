import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  MessageSquareIcon,
  NetworkIcon,
  ActivityIcon,
  RadioIcon,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { NodeSearch } from '@/components/NodeSearch';
import { authService } from '@/lib/auth/authService';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: BarChartIcon,
    },
    {
      title: 'Nodes',
      url: '/nodes',
      icon: NetworkIcon,
    },
    {
      title: 'My Nodes',
      url: '/nodes/my-nodes',
      icon: RadioIcon,
    },
    {
      title: 'Monitor',
      url: '/nodes/monitor',
      icon: ActivityIcon,
    },
    {
      title: 'Messages',
      url: '/messages',
      icon: MessageSquareIcon,
    },
  ],
  navSecondary: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Get user details from authService
  const currentUser = authService.getCurrentUser();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Meshtastic Bot UI</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-4 py-2">
          <NodeSearch />
        </div>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>

  );
}
