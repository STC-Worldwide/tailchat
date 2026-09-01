import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './official/skeleton';

export interface TcSkeletonProps {
  loading?: boolean;
  avatar?: boolean;
  title?: boolean;
  lines?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * 头像 + 标题 + 若干行的列表占位骨架, 每一块都是 shadcn Skeleton。
 *
 * 这里只负责排版; animate-pulse / rounded / bg-muted 全部来自 primitive,
 * 所以不再有 bg-black/10 dark:bg-white/10 这种脱离 token 的写法。
 */
export const TcSkeleton: React.FC<TcSkeletonProps> = React.memo(
  ({
    loading = true,
    avatar = false,
    title = true,
    lines = 2,
    className,
    children,
  }) => {
    if (!loading) {
      return <>{children}</>;
    }

    return (
      <div
        className={cn('flex items-start gap-3', className)}
        role="status"
        aria-label="Loading"
      >
        {avatar && <Skeleton className="h-10 w-10 shrink-0 rounded-full" />}
        <div className="min-w-0 flex-1 space-y-2">
          {title && <Skeleton className="h-4 w-2/5" />}
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn('h-3', index === lines - 1 ? 'w-3/5' : 'w-full')}
            />
          ))}
        </div>
      </div>
    );
  }
);
TcSkeleton.displayName = 'TcSkeleton';
