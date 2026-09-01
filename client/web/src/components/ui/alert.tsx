import React from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from './official/alert';

export type TcAlertVariant = 'default' | 'error' | 'warning' | 'success';

/**
 * Tailchat 的 title/description 便捷封装, 渲染交给 shadcn Alert。
 *
 * shadcn 只有 default/destructive 两个语气, 这里补上 warning/success。
 * 三个语气同一形状 (border-{tone}/30 + bg-{tone}/10 + text-{tone}), 都走
 * --color-danger / --color-warning / --color-success token, 所以不需要 dark: 变体。
 *
 * 语气色直接写在 title/description 上而不是靠继承: cn() 是 tailwind-merge,
 * 传进去的 text-* 会顶掉 shadcn 基类里的 text-muted-foreground, 结果与源码
 * 顺序无关。
 */
const TONES: Record<
  Exclude<TcAlertVariant, 'default'>,
  { surface: string; title: string; description: string }
> = {
  error: {
    surface: 'border-danger/30 bg-danger/10',
    title: 'text-danger',
    description: 'text-danger/90',
  },
  warning: {
    surface: 'border-warning/30 bg-warning/10',
    title: 'text-warning',
    description: 'text-warning/90',
  },
  success: {
    surface: 'border-success/30 bg-success/10',
    title: 'text-success',
    description: 'text-success/90',
  },
};

export interface TcAlertProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: TcAlertVariant;
  className?: string;
}

export const TcAlert: React.FC<TcAlertProps> = React.memo(
  ({ title, description, variant = 'default', className }) => {
    const tone = variant === 'default' ? undefined : TONES[variant];

    return (
      <Alert className={cn('px-4 py-3', tone?.surface, className)}>
        {title && (
          <AlertTitle className={cn('font-semibold', tone?.title)}>
            {title}
          </AlertTitle>
        )}
        {description && (
          <AlertDescription className={cn(title && 'mt-1', tone?.description)}>
            {description}
          </AlertDescription>
        )}
      </Alert>
    );
  }
);
TcAlert.displayName = 'TcAlert';
