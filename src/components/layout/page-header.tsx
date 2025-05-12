
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-grow">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className={cn(
          "flex flex-wrap shrink-0 items-center gap-2",
          "justify-start w-full sm:w-auto sm:justify-end" // Full width on mobile, auto on sm+
        )}>
          {actions}
        </div>
      )}
    </div>
  );
}

