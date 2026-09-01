import React from 'react';
import { cn } from '@/lib/utils';

export interface TcSkeletonProps {
  loading?: boolean;
  avatar?: boolean;
  title?: boolean;
  lines?: number;
  className?: string;
  children?: React.ReactNode;
}

/** Small tokenized loading placeholder for repeated list and panel layouts. */
export const TcSkeleton: React.FC<TcSkeletonProps> = React.memo(
  ({ loading = true, avatar = false, title = true, lines = 2, className, children }) => {
    if (!loading) {
      return <>{children}</>;
    }

    return (
      <div
        className={cn('flex items-start gap-3', className)}
        role="status"
        aria-label="Loading"
      >
        {avatar && <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />}
        <div className="min-w-0 flex-1 space-y-2">
          {title && <div className="h-4 w-2/5 animate-pulse rounded bg-black/10 dark:bg-white/10" />}
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-3 animate-pulse rounded bg-black/10 dark:bg-white/10',
                index === lines - 1 ? 'w-3/5' : 'w-full'
              )}
            />
          ))}
        </div>
      </div>
    );
  }
);
TcSkeleton.displayName = 'TcSkeleton';

export { TcSkeleton as Skeleton };
