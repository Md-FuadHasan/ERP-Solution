'use client';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useSidebar();

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col bg-background relative"> {/* Added relative for positioning context if needed */}
        {isMobile && (
          <div className="absolute top-4 left-4 z-50 md:hidden"> {/* Position trigger for mobile, hide on md+ */}
            <SidebarTrigger />
          </div>
        )}
        <main className="flex-1 flex flex-col overflow-hidden p-4 pt-16 md:pt-6 lg:pt-8"> {/* Adjusted top padding for mobile (pt-16), kept others */}
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
