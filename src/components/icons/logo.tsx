
import type { SVGProps } from 'react';
import { Files } from 'lucide-react'; // Using a generic icon for now

export function Logo(props: SVGProps<SVGSVGElement> & { showText?: boolean; iconClassName?: string }) {
  const { showText = true, iconClassName, ...rest } = props;
  return (
    <div className="flex items-center gap-2" aria-label="ProERP Logo">
      <Files className={cn("h-8 w-8 text-primary", iconClassName)} strokeWidth={1.5} />
      {showText && (
        <div className="flex flex-col">
          <span 
            className="text-xl font-bold text-sidebar-foreground"
            style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
          >
            ProERP
          </span>
          <span 
            className="text-xs text-sidebar-foreground/70 -mt-1"
            style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
          >
            Enterprise Solution
          </span>
        </div>
      )}
    </div>
  );
}

// Helper for cn if not already universally available
// You can remove this if you have a global cn setup
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
