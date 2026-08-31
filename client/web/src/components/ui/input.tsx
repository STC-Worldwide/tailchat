import React from 'react';
import { cn } from '@/lib/utils';

/**
 * token 化输入框 (facelift ui/ 基础组件) — 替代 antd Input
 * 纯样式包装原生 <input>, 无需 Base UI (antd Input 本身也只是样式包装)
 */
export const TcInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-9 px-3 rounded-lg bg-black/5 dark:bg-white/10 text-body text-sm',
      'border border-subtle placeholder:text-muted',
      'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className
    )}
    {...props}
  />
));
TcInput.displayName = 'TcInput';
