import React from 'react';
import { cn } from '@/lib/utils';

export interface TcTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning';
}

export const TcTag: React.FC<TcTagProps> = React.memo(
  ({ variant = 'default', className, ...props }) => (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
        {
          'bg-black/10 text-body dark:bg-white/10': variant === 'default',
          'bg-green-500/15 text-green-700 dark:text-green-300':
            variant === 'success',
          'bg-amber-500/15 text-amber-700 dark:text-amber-300':
            variant === 'warning',
        },
        className
      )}
      {...props}
    />
  )
);
TcTag.displayName = 'TcTag';
