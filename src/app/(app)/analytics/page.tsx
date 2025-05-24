
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Analytics"
        description="View detailed analytics and performance metrics."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            Analytics Dashboard
          </CardTitle>
          <CardDescription>
            This section will provide in-depth data visualizations and insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4 border-2 border-dashed border-border rounded-lg">
            <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Advanced Analytics Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              Detailed charts, graphs, and data breakdowns will be available here to help you understand your business performance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
