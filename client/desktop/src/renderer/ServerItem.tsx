import React from 'react';
import { cn } from '@/renderer/lib/utils';

interface ServerItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: React.ReactNode;
  icon: React.ReactNode | string;
  version?: string;
  status?: string;
}

export const ServerItem = React.memo(function ServerItem({
  children,
  className,
  icon,
  status,
  version,
  ...props
}: ServerItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'group flex min-h-28 w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left text-card-foreground outline-none transition-colors hover:border-control-border hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background text-primary">
        {typeof icon === 'string' ? (
          <img className="size-8 object-contain" alt="" src={icon} />
        ) : (
          icon
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate text-sm font-semibold">
            {children}
          </span>
          {status && (
            <span className="shrink-0 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[0.6875rem] leading-none text-muted-foreground">
              {status}
            </span>
          )}
        </span>
        {version && (
          <span
            className="mt-1 block truncate text-xs text-muted-foreground"
            title={version}
          >
            Version {version}
          </span>
        )}
      </span>
    </button>
  );
});
ServerItem.displayName = 'ServerItem';
