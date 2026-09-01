import React from 'react';
import { cn } from '@/lib/utils';

export const TcEmpty: React.FC<{
  description?: React.ReactNode;
  className?: string;
}> = React.memo(({ description, className }) => (
  <div
    className={cn(
      'flex min-h-24 items-center justify-center p-6 text-center text-sm text-muted-foreground',
      className
    )}
    role="status"
  >
    {description}
  </div>
));
TcEmpty.displayName = 'TcEmpty';
