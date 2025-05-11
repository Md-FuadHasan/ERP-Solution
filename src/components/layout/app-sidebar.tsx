'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { MAIN_NAV_ITEMS, APP_NAME } from '@/lib/constants';
import { Logo } from '@/components/icons/logo';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const { open, setOpen, isMobile, state } = useSidebar();

  const sidebarOpenClass = open ? 'translate-x-0' : '-translate-x-full';
  const collapsed = state === 'collapsed' && !isMobile;

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-2`}>
          {!collapsed && <Link href="/dashboard"><Logo className="h-8 w-auto text-sidebar-foreground" /></Link>}
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setOpen(!open)}
            title={open ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {open ? <PanelLeftClose /> : <PanelRightClose />}
            <span className="sr-only">{open ? "Collapse Sidebar" : "Expand Sidebar"}</span>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarMenu>
          {MAIN_NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  tooltip={collapsed ? item.label : undefined}
                  className={`w-full ${collapsed ? 'justify-center' : ''}`}
                >
                  <item.icon className={collapsed ? '' : 'mr-2'} />
                  {!collapsed && <span>{item.label}</span>}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
        {!collapsed && <p className="text-xs text-sidebar-foreground/70 text-center">&copy; {new Date().getFullYear()} {APP_NAME}</p>}
      </SidebarFooter>
    </Sidebar>
  );
}
