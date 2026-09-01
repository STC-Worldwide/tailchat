import React from 'react';
import { isValidStr } from 'tailchat-shared';
import { Icon } from 'tailchat-design';
import { cn } from '@/lib/utils';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import { Button } from '@/components/ui/official/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/official/tooltip';

/**
 * Plugin-compatible icon button backed by the official shadcn/ui Button and
 * Tooltip sources. The legacy public props stay stable while every consumer
 * receives the same tokens, focus ring, disabled state, and touch target.
 */
type IconBtnShapeType = 'circle' | 'square';
type IconBtnSizeType = 'small' | 'middle' | 'large';
/** 对应旧 antd Button 的 type(视觉变体), 不是原生 button 的 type */
type IconBtnVariantType = 'default' | 'primary' | 'text';

export interface IconBtnProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  icon: string;
  iconClassName?: string;
  shape?: IconBtnShapeType;
  size?: IconBtnSizeType;
  type?: IconBtnVariantType;
  danger?: boolean;
  title?: string;
  active?: boolean;
}

export const IconBtn = React.memo(
  React.forwardRef<HTMLButtonElement, IconBtnProps>(
    (
      {
        icon,
        iconClassName,
        className,
        title,
        shape = 'circle',
        size = 'middle',
        type = 'default',
        danger = false,
        active = false,
        ...props
      },
      ref
    ) => {
      const portalContainer = useAppPortalContainer();
      const buttonVariant = danger
        ? 'destructive'
        : type === 'primary'
        ? 'default'
        : type === 'text'
        ? 'ghost'
        : 'secondary';
      const buttonSize =
        size === 'small' ? 'icon-xs' : size === 'large' ? 'icon-lg' : 'icon';
      const accessibleLabel =
        props['aria-label'] ??
        (isValidStr(title)
          ? title
          : icon
              .replace(/^.*:/, '')
              .replace(/[-_]+/g, ' ')
              .trim());

      const btnEl = (
        <Button
          ref={ref}
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          aria-label={accessibleLabel}
          data-active={active || undefined}
          className={cn(
            'relative border-0 shadow-none after:absolute',
            shape === 'circle' ? 'rounded-full' : 'rounded-lg',
            size === 'small' &&
              'size-6 after:-inset-2.5 [&_svg]:text-sm',
            size === 'middle' &&
              'size-8 after:-inset-1.5 [&_svg]:text-base',
            size === 'large' &&
              'size-10 after:-inset-0.5 [&_svg]:text-lg',
            buttonVariant === 'default' && '[&_svg]:text-primary-foreground',
            buttonVariant === 'destructive' && '[&_svg]:text-destructive',
            (buttonVariant === 'secondary' || buttonVariant === 'ghost') &&
              '[&_svg]:text-foreground',
            active &&
              buttonVariant === 'secondary' &&
              'bg-sidebar-accent text-sidebar-accent-foreground',
            active && buttonVariant === 'ghost' && 'bg-muted text-foreground',
            className
          )}
          {...props}
        >
          <Icon aria-hidden="true" className={cn(iconClassName)} icon={icon} />
        </Button>
      );

      if (isValidStr(title) && !props.disabled) {
        return (
          <Tooltip>
            <TooltipTrigger render={btnEl} />
            <TooltipContent
              side="top"
              sideOffset={6}
              portalContainer={portalContainer}
            >
              {title}
            </TooltipContent>
          </Tooltip>
        );
      }

      return btnEl;
    }
  )
);
IconBtn.displayName = 'IconBtn';
