'use client';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppHeader() {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      {isMobile && <SidebarTrigger />}
      {!isMobile && <div className="w-8" /> /* Placeholder for desktop sidebar trigger space if sidebar is icon-only */}
      
      <div className="flex-1">
        {/* Optionally add a global search or breadcrumbs here */}
      </div>
      
      {/* User profile DropdownMenu has been moved to AppSidebar footer */}
    </header>
  );
}
