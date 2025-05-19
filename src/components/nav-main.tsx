import { BarChartIcon, NetworkIcon, RadioIcon, ActivityIcon, MessageSquareIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useWebSocket } from '@/providers/WebSocketProvider';

export function NavMain() {
  const { hasUnreadMessages, unreadMessages, markAllAsRead } = useWebSocket();
  const navigate = useNavigate();

  const handleMessagesClick = () => {
    markAllAsRead();
    navigate('/messages');
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem key="Dashboard">
            <SidebarMenuButton asChild tooltip="Dashboard">
              <Link to="/">
                <BarChartIcon />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key="Nodes">
            <SidebarMenuButton asChild tooltip="Nodes">
              <Link to="/nodes">
                <NetworkIcon />
                <span>Nodes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key="My Nodes">
            <SidebarMenuButton asChild tooltip="My Nodes">
              <Link to="/nodes/my-nodes">
                <RadioIcon />
                <span>My Nodes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key="Monitor">
            <SidebarMenuButton asChild tooltip="Monitor">
              <Link to="/nodes/monitor">
                <ActivityIcon />
                <span>Monitor</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key="Messages">
            <SidebarMenuButton asChild tooltip="Messages">
              <Link to="/messages" className="relative" onClick={handleMessagesClick}>
                <MessageSquareIcon />
                <span>Messages</span>
                {hasUnreadMessages && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white">
                    {unreadMessages.length > 9 ? '9+' : unreadMessages.length}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
