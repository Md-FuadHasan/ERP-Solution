
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
      <AppSidebar className="print:hidden" />
      <SidebarInset className="flex flex-1 flex-col bg-background relative print:m-0 print:p-0"> {/* SidebarInset renders as a <main> tag */}
        {isMobile && (
          <div className="absolute top-4 left-4 z-50 md:hidden print:hidden"> {/* Position trigger for mobile, hide on md+ */}
            <SidebarTrigger />
          </div>
        )}
        {/* Changed inner <main> to <div> to avoid nested <main> tags */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 pt-16 md:pt-6 lg:pt-8 print:p-0 print:pt-0 print:overflow-visible">
          {children}
        </div>
      </SidebarInset>
    </div>
  );
}

