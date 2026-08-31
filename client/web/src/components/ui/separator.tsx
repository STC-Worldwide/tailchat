import React from 'react';
import { cn } from '@/lib/utils';

/**
 * token 化分隔线 (facelift ui/ 基础组件) — 替代 antd Divider
 * 目前仅覆盖 antd Divider 最常见的水平/文字用法, 复杂排版仍用 antd
 */
export interface TcSeparatorProps {
  className?: string;
  children?: React.ReactNode;
}

export const TcSeparator: React.FC<TcSeparatorProps> = React.memo(
  ({ className, children }) => {
    if (!children) {
      return <hr className={cn('border-subtle', className)} />;
    }

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <hr className="flex-1 border-subtle" />
        <span className="text-muted text-sm whitespace-nowrap">{children}</span>
        <hr className="flex-1 border-subtle" />
      </div>
    );
  }
);
TcSeparator.displayName = 'TcSeparator';
