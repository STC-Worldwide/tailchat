import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './official/badge';

export interface TcTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning';
}

/**
 * 用户名旁边的小标签 (创建者 / 机器人 / 游客 / 权限组), 渲染交给 shadcn Badge。
 *
 * 保留原来的 rounded-md + px-1.5 几何, 只把配色换成 token:
 * success/warning 走 --color-success / --color-warning, 因此不再需要
 * dark: 变体; default 用 Badge 自己的 secondary 语气。
 */
const TONES: Record<NonNullable<TcTagProps['variant']>, string> = {
  default: '',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
};

export const TcTag: React.FC<TcTagProps> = React.memo(
  ({ variant = 'default', className, ...props }) => (
    <Badge
      variant="secondary"
      className={cn('rounded-md px-1.5', TONES[variant], className)}
      {...props}
    />
  )
);
TcTag.displayName = 'TcTag';
