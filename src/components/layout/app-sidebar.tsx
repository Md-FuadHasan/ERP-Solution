
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
import { PanelLeftClose, PanelRightClose, X, Settings, LogOut, UserCircle } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AppSidebar() {
  const pathname = usePathname();
  const { open, setOpen, isMobile, state, setOpenMobile } = useSidebar();

  const collapsed = state === 'collapsed' && !isMobile;

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        {isMobile ? (
          <div className="flex items-center justify-between p-3">
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
      <SidebarContent className="flex-1 overflow-y-auto p-2 sm:p-1">
        <SidebarMenu>
          {MAIN_NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  tooltip={collapsed ? item.label : undefined}
                  className={`w-full ${collapsed ? 'justify-center' : ''} text-sm py-2.5 sm:py-2`}
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                >
                  <item.icon className={`${collapsed && !isMobile ? '' : 'mr-2'} h-5 w-5 sm:h-4 sm:w-4`} />
                  {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
        {/* Profile Section */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {(!collapsed || isMobile) ? ( // Expanded view or mobile
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2 px-2 mb-2 hover:bg-sidebar-accent focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:ring-1"
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://picsum.photos/100/100?grayscale" alt="User Avatar" data-ai-hint="user avatar" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  {(!collapsed || isMobile) && (
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium text-sidebar-foreground truncate">Mother Company</span>
                      <span className="text-xs text-sidebar-foreground/80 truncate">admin@invoiceflow.com</span>
                    </div>
                  )}
                </div>
              </Button>
            ) : ( // Collapsed desktop view
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 mx-auto mb-2 hover:bg-sidebar-accent focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:ring-1">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://picsum.photos/100/100?grayscale" alt="User Avatar" data-ai-hint="user avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side={(!collapsed || isMobile) ? "top" : "right"} 
            align="start" 
            className="w-56 bg-popover text-popover-foreground border-border shadow-lg"
            sideOffset={5} 
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-popover-foreground">Mother Company</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@invoiceflow.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" onClick={() => { if (isMobile) setOpenMobile(false); }}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" onClick={() => { if (isMobile) setOpenMobile(false); }}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { /* Add actual logout logic here */ if (isMobile) setOpenMobile(false); }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Copyright Text */}
        {(!collapsed || isMobile) && (
          <p className="text-xs text-sidebar-foreground/70 text-center mt-1">&copy; {new Date().getFullYear()} {APP_NAME}</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
