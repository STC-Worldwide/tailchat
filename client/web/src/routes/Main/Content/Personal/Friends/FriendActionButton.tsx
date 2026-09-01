import { Button } from '@/components/ui/official/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/official/tooltip';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import { cn } from '@/lib/utils';
import React from 'react';

type FriendActionButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'size'
> & {
  label: string;
  icon: React.ReactNode;
};

/** Official shadcn/ui action with a desktop-compact, mobile-safe hit area. */
export const FriendActionButton = React.forwardRef<
  HTMLButtonElement,
  FriendActionButtonProps
>(({ className, icon, label, variant = 'ghost', ...props }, ref) => {
  const portalContainer = useAppPortalContainer();
  const button = (
    <Button
      ref={ref}
      type="button"
      size="icon"
      variant={variant}
      aria-label={label}
      className={cn('size-11 rounded-lg md:size-8', className)}
      {...props}
    >
      {icon}
    </Button>
  );

  if (props.disabled) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent
        side="top"
        sideOffset={6}
        portalContainer={portalContainer}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
});
FriendActionButton.displayName = 'FriendActionButton';
