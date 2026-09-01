import React from 'react';
import { cn } from '@/lib/utils';
import { Empty, EmptyDescription } from './official/empty';

/**
 * 「没有数据 / 未找到内容」的单行封装, 渲染交给 shadcn Empty。
 *
 * flex-none 是有意的: shadcn Empty 默认 flex-1, 而 NoData/NotFound 会被塞进
 * 各种 flex 容器里, 拉伸会改掉调用方的布局。min-h-24 保留原来的最小高度。
 */
export const TcEmpty: React.FC<{
  description?: React.ReactNode;
  className?: string;
}> = React.memo(({ description, className }) => (
  <Empty role="status" className={cn('min-h-24 flex-none', className)}>
    <EmptyDescription>{description}</EmptyDescription>
  </Empty>
));
TcEmpty.displayName = 'TcEmpty';
