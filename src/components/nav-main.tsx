import * as React from 'react';
import {
  ActivityIcon,
  BarChartIcon,
  CircleDashedIcon,
  CloudRainIcon,
  MapIcon,
  MessageSquareIcon,
  NetworkIcon,
  RadioIcon,
  RouteIcon,
  ServerIcon,
  SignalIcon,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useWebSocket } from '@/providers/WebSocketProvider';

type NavChild = {
  title: string;
  url: string;
  icon: LucideIcon;
};

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  tooltip?: string;
  children?: NavChild[];
};

function isPathActive(pathname: string, url: string, exact: boolean) {
  if (exact) {
    return pathname === url;
  }
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function NavMain() {
  const { hasUnreadMessages, unreadMessages, markAllAsRead } = useWebSocket();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleMessagesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    markAllAsRead();
    navigate('/messages');
  };

  const items: NavItem[] = [
    { title: 'Dashboard', url: '/', icon: BarChartIcon },
    { title: 'Messages', url: '/messages', icon: MessageSquareIcon },
    {
      title: 'Nodes',
      url: '/nodes',
      icon: NetworkIcon,
      children: [
        { title: 'My nodes', url: '/nodes/my-nodes', icon: RadioIcon },
        { title: 'Watches', url: '/nodes/monitor', icon: ActivityIcon },
        { title: 'Mesh infra', url: '/nodes/infrastructure', icon: ServerIcon },
      ],
    },
    { title: 'Weather', url: '/weather', icon: CloudRainIcon },
    {
      title: 'Traceroutes',
      url: '/traceroutes',
      icon: RouteIcon,
      children: [
        { title: 'Heatmap', url: '/traceroutes/map/heat', icon: MapIcon },
        { title: 'Link quality', url: '/traceroutes/map/snr', icon: SignalIcon },
        { title: 'Coverage', url: '/traceroutes/map/coverage', icon: CircleDashedIcon },
        {
          title: 'Constellation coverage',
          url: '/traceroutes/map/coverage/constellation',
          icon: CircleDashedIcon,
        },
      ],
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            // Parent should only be highlighted when its own page is active, not when a child is active.
            const parentActive = isPathActive(pathname, item.url, true);
            const isMessages = item.title === 'Messages';

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.tooltip ?? item.title} isActive={parentActive}>
                  {isMessages ? (
                    <Link to={item.url} className="relative" onClick={handleMessagesClick}>
                      <Icon />
                      <span>{item.title}</span>
                      {hasUnreadMessages && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white">
                          {unreadMessages.length > 9 ? '9+' : unreadMessages.length}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <Link to={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
                {item.children && item.children.length > 0 && (
                  <SidebarMenuSub>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childIsActive = isPathActive(pathname, child.url, true);
                      return (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton asChild isActive={childIsActive}>
                            <Link to={child.url}>
                              <ChildIcon />
                              <span>{child.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
