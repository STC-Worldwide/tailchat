import React from 'react';
import clsx from 'clsx';

type Variant = 'default' | 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variantClass: Record<Variant, string> = {
  default:
    'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-body',
  primary: 'bg-primary hover:bg-primary-hover text-white',
  ghost: 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-body',
  danger: 'bg-danger hover:bg-danger-hover text-white',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-7 px-2 text-sm rounded',
  md: 'h-9 px-3 text-sm rounded-md',
  lg: 'h-11 px-4 text-base rounded-md',
  // WCAG 2.2: 24px 最小命中目标
  icon: 'h-9 w-9 rounded-md justify-center',
};

export interface TcButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/**
 * token 化按钮 (facelift ui/ 基础组件) — 逐步替代 antd Button 的落点
 */
export const TcButton = React.forwardRef<HTMLButtonElement, TcButtonProps>(
  ({ variant = 'default', size = 'md', className, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    />
  )
);
TcButton.displayName = 'TcButton';
