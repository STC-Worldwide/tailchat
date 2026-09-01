import React from 'react';
import { Badge } from '@/components/ui/official/badge';
import { cn } from '@/lib/utils';

export interface SidebarBadgeProps {
  status?: 'default' | 'error' | 'success';
  count?: number;
  dot?: boolean;
  className?: string;
}

export const SidebarBadge: React.FC<SidebarBadgeProps> = React.memo(
  ({ status = 'error', count, dot = false, className }) => {
    if (dot) {
      return (
        <Badge
          aria-label="Unread"
          className={cn(
            'size-2 min-w-0 border-0 p-0',
            status === 'error' && 'bg-destructive',
            status === 'default' && 'bg-muted-foreground',
            status === 'success' && 'bg-green-500',
            className
          )}
        />
      );
    }

    if (typeof count !== 'number' || count <= 0) {
      return null;
    }

    return (
      <Badge
        aria-label={`${count} unread`}
        className={cn('h-5 min-w-5 rounded-full px-1 text-[10px]', className)}
      >
        {count > 99 ? '99+' : count}
      </Badge>
    );
  }
);
SidebarBadge.displayName = 'SidebarBadge';
