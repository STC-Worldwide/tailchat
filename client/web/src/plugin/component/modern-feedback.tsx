import React from 'react';
import { CircleHelpIcon } from 'lucide-react';
import {
  closeFeedbackNotification,
  destroyFeedbackNotifications,
  showRichFeedbackNotification,
  type FeedbackPlacement,
  type FeedbackType,
} from '@/components/ui/feedback';
import { cn } from '@/lib/utils';
import { Button, type PluginButtonProps } from './modern-controls';
import { Popover, type PluginPopoverProps } from './modern-display';

// Impeccable persistence exemption: this module is an ordinary compatibility
// extension of Tailchat's incumbent Operate world. It adds no new visual
// direction, form seed, quality bar, or durable design-system decision.

type LegacyConfirmContent = React.ReactNode | (() => React.ReactNode);

export interface PluginPopconfirmProps
  extends Omit<
    PluginPopoverProps,
    | 'content'
    | 'defaultOpen'
    | 'defaultVisible'
    | 'onOpenChange'
    | 'onVisibleChange'
    | 'open'
    | 'title'
    | 'trigger'
    | 'visible'
  > {
  cancelButtonProps?: PluginButtonProps;
  cancelText?: React.ReactNode;
  defaultOpen?: boolean;
  defaultVisible?: boolean;
  description?: LegacyConfirmContent;
  disabled?: boolean;
  icon?: React.ReactNode;
  okButtonProps?: PluginButtonProps;
  okText?: React.ReactNode;
  okType?: PluginButtonProps['type'];
  onCancel?: (event?: React.MouseEvent<HTMLElement>) => void;
  onConfirm?: (event?: React.MouseEvent<HTMLElement>) => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
  onVisibleChange?: (visible: boolean) => void;
  open?: boolean;
  showCancel?: boolean;
  title?: LegacyConfirmContent;
  visible?: boolean;
}

/**
 * Ant Design-compatible confirmation behavior rendered with Tailchat's
 * official shadcn/ui Popover and Button sources.
 */
export const Popconfirm: React.FC<PluginPopconfirmProps> = React.memo(
  ({
    cancelButtonProps,
    cancelText = 'Cancel',
    children,
    defaultOpen,
    defaultVisible,
    description,
    disabled = false,
    icon = <CircleHelpIcon />,
    okButtonProps,
    okText = 'Confirm',
    okType = 'primary',
    onCancel,
    onConfirm,
    onOpenChange,
    onVisibleChange,
    open,
    overlayClassName,
    showCancel = true,
    title,
    visible,
    ...popoverProps
  }) => {
    const controlledOpen = open ?? visible;
    const isControlled = controlledOpen !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
      defaultOpen ?? defaultVisible ?? false
    );
    const [confirming, setConfirming] = React.useState(false);
    const currentOpen = isControlled ? controlledOpen : uncontrolledOpen;
    const titleId = React.useId();
    const descriptionId = React.useId();
    const resolvedTitle = typeof title === 'function' ? title() : title;
    const resolvedDescription =
      typeof description === 'function' ? description() : description;
    const emitOpenChange = (nextOpen: boolean) => {
      if (nextOpen && disabled) {
        return;
      }
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
      onVisibleChange?.(nextOpen);
    };

    if (disabled) {
      return <>{children}</>;
    }

    return (
      <Popover
        {...popoverProps}
        open={currentOpen}
        onOpenChange={emitOpenChange}
        trigger="click"
        overlayClassName={cn('w-72 p-3', overlayClassName)}
        content={
          <div
            role="alertdialog"
            aria-modal="false"
            aria-labelledby={titleId}
            aria-describedby={resolvedDescription ? descriptionId : undefined}
            className="space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400 [&_svg]:size-4"
              >
                {icon}
              </span>
              <div className="min-w-0 space-y-1">
                <div id={titleId} className="text-sm font-medium leading-5">
                  {resolvedTitle}
                </div>
                {resolvedDescription && (
                  <div
                    id={descriptionId}
                    className="text-sm leading-5 text-muted-foreground"
                  >
                    {resolvedDescription}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {showCancel && (
                <Button
                  size="small"
                  {...cancelButtonProps}
                  disabled={confirming || cancelButtonProps?.disabled}
                  onClick={(event) => {
                    onCancel?.(event);
                    emitOpenChange(false);
                  }}
                >
                  {cancelText}
                </Button>
              )}
              <Button
                size="small"
                type={okType}
                {...okButtonProps}
                loading={confirming || okButtonProps?.loading}
                onClick={async (event) => {
                  setConfirming(true);
                  try {
                    await onConfirm?.(event);
                    emitOpenChange(false);
                  } finally {
                    setConfirming(false);
                  }
                }}
              >
                {okText}
              </Button>
            </div>
          </div>
        }
      >
        {children}
      </Popover>
    );
  }
);
Popconfirm.displayName = 'PluginPopconfirm';

export interface PluginNotificationArgs {
  btn?: React.ReactNode;
  className?: string;
  closeIcon?: React.ReactNode;
  description?: React.ReactNode;
  duration?: number | null;
  icon?: React.ReactNode;
  key?: React.Key;
  message: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onClose?: () => void;
  placement?: FeedbackPlacement;
  style?: React.CSSProperties;
}

interface PluginNotificationDefaults {
  duration?: number;
  placement?: FeedbackPlacement;
}

let notificationDefaults: PluginNotificationDefaults = {
  duration: 4.5,
  placement: 'topRight',
};

function openNotification(
  args: PluginNotificationArgs,
  type: FeedbackType = 'info'
) {
  return showRichFeedbackNotification({
    action: args.btn,
    className: args.className,
    closeIcon: args.closeIcon,
    description: args.description,
    duration:
      args.duration === null
        ? notificationDefaults.duration
        : args.duration ?? notificationDefaults.duration,
    icon: args.icon,
    key: args.key,
    message: args.message,
    onClick: args.onClick,
    onClose: args.onClose,
    placement: args.placement ?? notificationDefaults.placement,
    style: args.style,
    type,
  });
}

const notificationApi = {
  open: (args: PluginNotificationArgs) => {
    openNotification(args);
  },
  info: (args: PluginNotificationArgs) => {
    openNotification(args, 'info');
  },
  success: (args: PluginNotificationArgs) => {
    openNotification(args, 'success');
  },
  warning: (args: PluginNotificationArgs) => {
    openNotification(args, 'warning');
  },
  warn: (args: PluginNotificationArgs) => {
    openNotification(args, 'warning');
  },
  error: (args: PluginNotificationArgs) => {
    openNotification(args, 'error');
  },
  close: closeFeedbackNotification,
  destroy: destroyFeedbackNotifications,
  config: (defaults: PluginNotificationDefaults) => {
    notificationDefaults = { ...notificationDefaults, ...defaults };
  },
};

export const notification = {
  ...notificationApi,
  useNotification: () => [notificationApi, null] as const,
};
