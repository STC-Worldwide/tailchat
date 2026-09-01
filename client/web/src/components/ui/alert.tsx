import React from 'react';
import { cn } from '@/lib/utils';

export interface TcAlertProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'error' | 'warning' | 'success';
  className?: string;
}

export const TcAlert: React.FC<TcAlertProps> = React.memo(
  ({ title, description, variant = 'default', className }) => (
    <div
      role="alert"
      className={cn(
        'w-full rounded-lg border px-4 py-3 text-sm',
        {
          'border-subtle bg-black/5 text-body dark:bg-white/5':
            variant === 'default',
          'border-danger/30 bg-danger/10 text-danger': variant === 'error',
          'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300':
            variant === 'warning',
          'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300':
            variant === 'success',
        },
        className
      )}
    >
      {title && <div className="font-semibold">{title}</div>}
      {description && <div className={title ? 'mt-1' : undefined}>{description}</div>}
    </div>
  )
);
TcAlert.displayName = 'TcAlert';
