import { LogOutIcon, MoreVerticalIcon, UserCircleIcon, RadioIcon, BellIcon, MessageSquareIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/providers/AuthProvider';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { User } from '@/lib/auth/authService';
import { Badge } from '@/components/ui/badge';

export function NavUser({ user }: { user: User | null }) {
  const { isMobile } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { hasUnreadMessages, unreadMessages, markAllAsRead } = useWebSocket();

  const handleMessagesClick = () => {
    markAllAsRead();
    navigate('/messages');
  };

  return (
    <SidebarMenu>
      {/* Notification Bell */}
      {hasUnreadMessages && (
        <SidebarMenuItem>
          <SidebarMenuButton onClick={handleMessagesClick} className="relative">
            <BellIcon className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white">
              {unreadMessages.length > 9 ? '9+' : unreadMessages.length}
            </Badge>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.display_name || user?.email}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.username}</span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar} alt={user?.display_name || user?.email} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.username}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleMessagesClick}>
                <MessageSquareIcon className="mr-2 h-4 w-4" />
                Messages
                {hasUnreadMessages && (
                  <Badge className="ml-auto flex h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white">
                    {unreadMessages.length}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/user/nodes">
                  <RadioIcon className="mr-2 h-4 w-4" />
                  My Nodes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/user">
                  <UserCircleIcon className="mr-2 h-4 w-4" />
                  Account
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
