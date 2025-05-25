
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
import { MAIN_NAV_SECTIONS, APP_NAME } from '@/lib/constants';
import { Logo } from '@/components/icons/logo';
import { PanelLeftClose, PanelRightClose, X, Settings, LogOut, UserCircle, Files } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const { open, setOpen, isMobile, state, setOpenMobile } = useSidebar();

  const collapsed = state === 'collapsed' && !isMobile;

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className="bg-sidebar text-sidebar-foreground print:hidden">
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center">
        {isMobile ? (
          <div className="flex items-center justify-between p-3 w-full">
            <Link href="/dashboard" onClick={() => setOpenMobile(false)} className="focus:outline-none focus:ring-2 focus:ring-sidebar-ring rounded-sm">
              <Logo showText={true} iconClassName="text-primary"/>
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
          <div className={cn("flex items-center p-3 w-full", collapsed ? 'justify-center' : 'justify-between')}>
            {!collapsed && (
              <Link href="/dashboard" className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-sidebar-ring rounded-sm">
                <Logo showText={true} iconClassName="text-primary"/>
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
      <SidebarContent className="flex-1 overflow-y-auto p-2">
        {MAIN_NAV_SECTIONS.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? "mt-3 pt-3 border-t border-sidebar-border/50" : ""}>
            {(!collapsed || isMobile) && (
              <h2 className="px-3 py-1.5 text-xs font-semibold uppercase text-sidebar-foreground/70 tracking-wider">
                {section.title}
              </h2>
            )}
            {collapsed && !isMobile && sectionIndex > 0 && (
                <div className="my-2 h-px w-full bg-sidebar-border/50"></div>
            )}
             {collapsed && !isMobile && sectionIndex === 0 && (
                <div className="mb-2"></div> 
            )}


            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.disabled ? "#" : item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                      tooltip={collapsed ? item.label : undefined}
                      className={cn(
                        `w-full ${collapsed ? 'justify-center' : ''} text-sm py-2`,
                        item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-sidebar-foreground"
                      )}
                      onClick={() => {
                        if (item.disabled) return;
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                      disabled={item.disabled}
                      aria-disabled={item.disabled}
                    >
                      <item.icon className={`${collapsed && !isMobile ? '' : 'mr-2'} h-4 w-4`} />
                      {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {(!collapsed || isMobile) ? (
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2 px-2 mb-1 hover:bg-sidebar-accent focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:ring-1"
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/80x80.png?text=U" data-ai-hint="user avatar" alt="User Avatar" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-sidebar-foreground truncate">Admin User</span>
                    <span className="text-xs text-sidebar-foreground/80 truncate">admin@proerp.com</span>
                  </div>
                </div>
              </Button>
            ) : ( 
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 mx-auto mb-1 hover:bg-sidebar-accent focus-visible:ring-sidebar-ring focus-visible:ring-offset-0 focus-visible:ring-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/80x80.png?text=U" data-ai-hint="user avatar" alt="User Avatar" />
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
                <p className="text-sm font-medium leading-none text-popover-foreground">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@proerp.com
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
            <DropdownMenuItem onClick={() => { if (isMobile) setOpenMobile(false); /* Add actual logout logic here */ }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
