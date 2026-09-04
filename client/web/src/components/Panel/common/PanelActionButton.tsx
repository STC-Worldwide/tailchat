import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/official/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/official/tooltip';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import { cn } from '@/lib/utils';
import React from 'react';

type PanelActionButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'size' | 'variant'
> & {
  label: string;
  icon: React.ReactNode;
  /**
   * 这个按钮是个开关, 并且当前是"开"。
   *
   * 会带上 aria-pressed —— 读屏靠它区分开关和普通按钮, 光把背景涂深是看不出来的。
   */
  active?: boolean;
};

/**
 * Compact panel action built directly from the official shadcn/ui Button and
 * Tooltip primitives. Mobile keeps a 44px touch target while desktop uses the
 * denser application-header size.
 */
export const PanelActionButton = React.forwardRef<
  HTMLButtonElement,
  PanelActionButtonProps
>(({ className, icon, label, active, ...props }, ref) => {
  const portalContainer = useAppPortalContainer();
  const button = (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'size-11 rounded-lg md:size-8',
        active && 'bg-accent text-accent-foreground',
        className
      )}
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
        side="bottom"
        sideOffset={6}
        portalContainer={portalContainer}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
});
PanelActionButton.displayName = 'PanelActionButton';

/** Keep Iconify strings working at the public plugin-action boundary. */
export const PluginPanelActionIcon: React.FC<{ icon: string }> = ({ icon }) => (
  <Icon aria-hidden="true" icon={icon} className="size-[18px]" />
);
PluginPanelActionIcon.displayName = 'PluginPanelActionIcon';
