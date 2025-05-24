
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity as ActivityIcon } from 'lucide-react';

export default function ActivityLogPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Activity Log"
        description="View a comprehensive log of system and user activities."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ActivityIcon className="mr-2 h-6 w-6 text-primary" />
            System Activity Feed
          </CardTitle>
          <CardDescription>
            Track important actions and changes made within the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <ActivityIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Activity Logging Features Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              This area will provide a detailed audit trail of user actions, system events, and data modifications.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
