import React from 'react';
import { cn } from '@/lib/utils';

export type TcStatus = 'default' | 'error' | 'success';

export interface TcStatusDotProps {
  status?: TcStatus;
  className?: string;
}

export const TcStatusDot: React.FC<TcStatusDotProps> = React.memo(
  ({ status = 'error', className }) => (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        {
          'bg-danger': status === 'error',
          'bg-gray-400 dark:bg-gray-500': status === 'default',
          'bg-green-500': status === 'success',
        },
        className
      )}
    />
  )
);
TcStatusDot.displayName = 'TcStatusDot';
