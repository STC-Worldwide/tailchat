import React from 'react';
import { cn } from '@/lib/utils';
import { TcStatusDot, type TcStatus } from './status-dot';

export interface TcBadgeProps {
  status?: TcStatus;
  count?: number;
  dot?: boolean;
  className?: string;
}

export const TcBadge: React.FC<TcBadgeProps> = React.memo(
  ({ status = 'error', count, dot = false, className }) => {
    if (dot) {
      return <TcStatusDot status={status} className={className} />;
    }

    if (typeof count !== 'number' || count <= 0) {
      return null;
    }

    return (
      <span
        aria-label={`${count} unread`}
        className={cn(
          'inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium leading-none text-white',
          className
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
    );
  }
);
TcBadge.displayName = 'TcBadge';
