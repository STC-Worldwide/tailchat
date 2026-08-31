import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * shadcn 标准 Button 形态 (cva variants), 沿用 TcButton 命名保持既有 import 不变。
 * radius/8px 语言与容器统一 (facelift 视觉标准审计, 2026-08-31)。
 */
export const buttonVariants = cva(
  'inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer select-none ' +
    'disabled:opacity-50 disabled:cursor-not-allowed ' +
    'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
  {
    variants: {
      variant: {
        default:
          'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-body',
        primary: 'bg-primary hover:bg-primary-hover text-white',
        ghost:
          'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-body',
        danger: 'bg-danger hover:bg-danger-hover text-white',
      },
      size: {
        sm: 'h-7 px-2 text-sm rounded-md',
        md: 'h-9 px-3 text-sm rounded-lg',
        lg: 'h-11 px-4 text-base rounded-lg',
        // WCAG 2.2: 24px 最小命中目标
        icon: 'h-9 w-9 rounded-lg justify-center',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface TcButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * token 化按钮 (facelift ui/ 基础组件) — 逐步替代 antd Button 的落点
 */
export const TcButton = React.forwardRef<HTMLButtonElement, TcButtonProps>(
  ({ variant, size, className, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
TcButton.displayName = 'TcButton';
