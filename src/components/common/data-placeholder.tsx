import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react'; // Or any other appropriate icon

interface DataPlaceholderProps {
  title?: string;
  message: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}

export function DataPlaceholder({
  title = "No Data Found",
  message,
  icon: Icon = Inbox,
  action,
  className,
}: DataPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-8 text-center shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-10 w-10 text-secondary-foreground" />
      </div>
      <h3 className="mb-1 text-xl font-semibold text-card-foreground">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
