
'use client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export default function AiSuggestionsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="AI Suggestions"
        description="Get intelligent insights and suggestions to optimize your business operations."
      />
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-6 w-6 text-primary" />
            AI Suggestions
          </CardTitle>
          <CardDescription>
            Leverage AI to get actionable recommendations for your business operations, including sales forecasting and other insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales Forecasting Card */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Forecasting</CardTitle>
                <CardDescription>Predict future sales based on historical data.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Sales forecasting results will be displayed here.</p>
              </CardContent>
            </Card>
            {/* Coming Soon Card */}
            <Card className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-border rounded-lg min-h-[200px]">
              <Lightbulb className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">AI Suggestion Features Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                This section will offer AI-driven suggestions for sales strategies, inventory optimization, customer engagement, financial forecasting, and more.
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
