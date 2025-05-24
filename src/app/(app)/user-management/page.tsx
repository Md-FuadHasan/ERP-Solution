
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UserManagementPage() {
  // TODO: Eventually move user/manager management logic from Settings here if it becomes more complex.
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="User Management"
        description="Manage application users, roles, and permissions."
         actions={
          <Button asChild>
            <Link href="/settings?tab=users">Configure App Users</Link>
          </Button>
        }
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCog className="mr-2 h-6 w-6 text-primary" />
            User Administration
          </CardTitle>
          <CardDescription>
            Define user roles and control access to application features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <UserCog className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">User & Role Management Features Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              This section will allow for detailed user role creation, permission assignments, and user account management. For now, basic user/manager configuration is in Settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
