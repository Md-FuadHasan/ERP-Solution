
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SlidersHorizontal } from 'lucide-react';

export default function SystemToolsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="System Tools"
        description="Access administrative tools for system maintenance and configuration."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <SlidersHorizontal className="mr-2 h-6 w-6 text-primary" />
            Administrative Tools
          </CardTitle>
          <CardDescription>
            Manage data backups, imports/exports, and system health.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <SlidersHorizontal className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">System Tools Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              This area will provide functionalities for data backup & restore, data import/export utilities, system diagnostics, and advanced configurations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
