
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';

export default function AttendancePage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Attendance"
        description="Manage employee attendance records and tracking."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="mr-2 h-6 w-6 text-primary" />
            Attendance Management
          </CardTitle>
          <CardDescription>
            Track employee check-ins, check-outs, and overall attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Attendance Tracking Features Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              This module will allow for employee attendance logging, leave management integration, and reporting.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
