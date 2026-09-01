import React from 'react';
import { Separator } from './official/separator';
import { cn } from '@/lib/utils';

/**
 * 带文字的水平分隔线, 渲染交给 shadcn Separator。
 * 覆盖旧 antd Divider 在本仓库用到的全部用法 (纯线 + 居中文字)。
 */
export interface TcSeparatorProps {
  className?: string;
  children?: React.ReactNode;
}

export const TcSeparator: React.FC<TcSeparatorProps> = React.memo(
  ({ className, children }) => {
    if (!children) {
      return <Separator className={className} />;
    }

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {children}
        </span>
        <Separator className="flex-1" />
      </div>
    );
  }
);
TcSeparator.displayName = 'TcSeparator';

export { Separator };
