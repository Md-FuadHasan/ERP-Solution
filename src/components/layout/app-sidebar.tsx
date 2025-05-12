
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
import { PanelLeftClose, PanelRightClose, X } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const { open, setOpen, isMobile, state, setOpenMobile } = useSidebar();

  const collapsed = state === 'collapsed' && !isMobile;

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        {isMobile ? (
          <div className="flex items-center justify-between p-3"> {/* Mobile sheet header */}
            <Link href="/dashboard" onClick={() => setOpenMobile(false)} className="focus:outline-none focus:ring-2 focus:ring-sidebar-ring rounded-sm">
              <Logo className="h-8 w-auto text-sidebar-foreground" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => setOpenMobile(false)} 
              title="Close Menu"
            >
              <X className="h-5 w-5"/>
              <span className="sr-only">Close Menu</span>
            </Button>
          </div>
        ) : (
          // Desktop header
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-3`}>
            {!collapsed && ( 
              <Link href="/dashboard" className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-sidebar-ring rounded-sm">
                <Logo className="h-8 w-auto text-sidebar-foreground" />
              </Link>
            )}
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
        )}
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto p-2 sm:p-1"> {/* Added padding for better spacing of menu items */}
        <SidebarMenu>
          {MAIN_NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  tooltip={collapsed ? item.label : undefined}
                  className={`w-full ${collapsed ? 'justify-center' : ''} text-sm py-2.5 sm:py-2`} // Ensure buttons are tappable
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                >
                  <item.icon className={`${collapsed && !isMobile ? '' : 'mr-2'} h-5 w-5 sm:h-4 sm:w-4`} /> {/* Slightly larger icons */}
                  {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
        {(!collapsed || isMobile) && <p className="text-xs text-sidebar-foreground/70 text-center">&copy; {new Date().getFullYear()} {APP_NAME}</p>}
      </SidebarFooter>
    </Sidebar>
  );
}

