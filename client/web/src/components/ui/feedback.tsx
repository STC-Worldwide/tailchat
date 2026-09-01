import React, { useState } from 'react';
import { t } from 'tailchat-shared';
import { Button } from './official/button';
import { TcDialog } from './dialog';
import {
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeedbackType = 'info' | 'success' | 'error' | 'warning';
export type FeedbackPlacement =
  | 'topLeft'
  | 'top'
  | 'topRight'
  | 'bottomLeft'
  | 'bottom'
  | 'bottomRight';

interface FeedbackItem {
  className?: string;
  closeIcon?: React.ReactNode;
  id: number;
  key?: React.Key;
  message: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  placement: FeedbackPlacement;
  type: FeedbackType;
  persistent?: boolean;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onClose?: () => void;
}

export interface FeedbackNotificationOptions {
  action?: React.ReactNode;
  className?: string;
  closeIcon?: React.ReactNode;
  description?: React.ReactNode;
  duration?: number;
  icon?: React.ReactNode;
  key?: React.Key;
  message: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onClose?: () => void;
  placement?: FeedbackPlacement;
  style?: React.CSSProperties;
  type?: FeedbackType;
}

interface FeedbackAlert {
  id: number;
  message: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
}

interface FeedbackSnapshot {
  items: FeedbackItem[];
  alert: FeedbackAlert | null;
}

let nextId = 1;
let snapshot: FeedbackSnapshot = { items: [], alert: null };
const listeners = new Set<() => void>();
const notificationTimers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((listener) => listener());
}

function update(next: FeedbackSnapshot) {
  snapshot = next;
  emit();
}

function clearItemTimer(id: number) {
  const timer = notificationTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    notificationTimers.delete(id);
  }
}

function removeItem(id: number, notifyClose = true) {
  const item = snapshot.items.find((candidate) => candidate.id === id);
  if (!item) {
    return;
  }
  clearItemTimer(id);
  update({
    ...snapshot,
    items: snapshot.items.filter((item) => item.id !== id),
  });
  if (notifyClose) {
    item.onClose?.();
  }
}

function scheduleItemRemoval(id: number, duration: number) {
  clearItemTimer(id);
  if (duration > 0) {
    notificationTimers.set(
      id,
      setTimeout(() => removeItem(id), duration * 1000)
    );
  }
}

function isNestedInteractiveTarget(
  event: React.SyntheticEvent<HTMLDivElement>
) {
  const target = event.target;
  return (
    target instanceof Element &&
    target !== event.currentTarget &&
    Boolean(
      target.closest(
        'a, button, input, select, textarea, [role="button"], [role="link"]'
      )
    )
  );
}

export function showFeedbackToast(
  message: string,
  type: FeedbackType = 'info'
) {
  const id = nextId++;
  update({
    ...snapshot,
    items: [...snapshot.items, { id, message, type, placement: 'topRight' }],
  });
  scheduleItemRemoval(id, 3);
}

export function showFeedbackLoading(message: string) {
  const id = nextId++;
  update({
    ...snapshot,
    items: [
      ...snapshot.items,
      {
        id,
        message,
        type: 'info',
        placement: 'topRight',
        persistent: true,
      },
    ],
  });
  return () => removeItem(id);
}

export function showFeedbackNotification(
  message: React.ReactNode,
  duration = 3
) {
  return showRichFeedbackNotification({ message, duration });
}

export function showRichFeedbackNotification({
  action,
  className,
  closeIcon,
  description,
  duration = 4.5,
  icon,
  key,
  message,
  onClick,
  onClose,
  placement = 'topRight',
  style,
  type = 'info',
}: FeedbackNotificationOptions) {
  const existingItem =
    key === undefined
      ? undefined
      : snapshot.items.find((item) => item.key === key);
  const id = existingItem?.id ?? nextId++;
  const item: FeedbackItem = {
    className,
    closeIcon,
    id,
    key,
    message,
    description,
    action,
    icon,
    placement,
    type,
    persistent: duration === 0,
    style,
    onClick,
    onClose,
  };
  clearItemTimer(id);
  update({
    ...snapshot,
    items: existingItem
      ? snapshot.items.map((candidate) =>
          candidate.id === id ? item : candidate
        )
      : [...snapshot.items, item],
  });
  scheduleItemRemoval(id, duration);
  return () => removeItem(id);
}

export function closeFeedbackNotification(key: React.Key) {
  const item = snapshot.items.find((candidate) => candidate.key === key);
  if (item) {
    removeItem(item.id);
  }
}

export function destroyFeedbackNotifications(key?: React.Key) {
  if (key !== undefined) {
    closeFeedbackNotification(key);
    return;
  }

  const items = snapshot.items;
  items.forEach((item) => clearItemTimer(item.id));
  update({ ...snapshot, items: [] });
  items.forEach((item) => item.onClose?.());
}

export function showFeedbackAlert(options: Omit<FeedbackAlert, 'id'>) {
  update({ ...snapshot, alert: { ...options, id: nextId++ } });
}

const feedbackTone: Record<FeedbackType, string> = {
  info: 'border-primary/25 bg-popover',
  success: 'border-emerald-500/30 bg-popover',
  error: 'border-destructive/30 bg-popover',
  warning: 'border-amber-500/30 bg-popover',
};

const feedbackIconTone: Record<FeedbackType, string> = {
  info: 'text-primary',
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-destructive',
  warning: 'text-amber-600 dark:text-amber-400',
};

const feedbackIcon: Record<FeedbackType, React.ReactNode> = {
  info: <InfoIcon />,
  success: <CircleCheckIcon />,
  error: <CircleXIcon />,
  warning: <TriangleAlertIcon />,
};

const placementClassName: Record<FeedbackPlacement, string> = {
  topLeft: 'left-4 top-4 items-start',
  top: 'left-1/2 top-4 -translate-x-1/2 items-center',
  topRight: 'right-4 top-4 items-end',
  bottomLeft: 'bottom-4 left-4 items-start',
  bottom: 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  bottomRight: 'bottom-4 right-4 items-end',
};

const feedbackPlacements = Object.keys(
  placementClassName
) as FeedbackPlacement[];

export const FeedbackHost: React.FC = React.memo(() => {
  const [, forceUpdate] = useState(0);
  const [confirming, setConfirming] = useState(false);

  React.useEffect(() => {
    const listener = () => forceUpdate((value) => value + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const activeAlert = snapshot.alert;
  const closeAlert = () => {
    if (!confirming) update({ ...snapshot, alert: null });
  };
  const confirmAlert = async () => {
    if (!activeAlert?.onConfirm) return closeAlert();
    setConfirming(true);
    try {
      await activeAlert.onConfirm();
      update({ ...snapshot, alert: null });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      {feedbackPlacements.map((placement) => {
        const items = snapshot.items.filter(
          (item) => item.placement === placement
        );
        if (items.length === 0) {
          return null;
        }

        return (
          <div
            key={placement}
            aria-live="polite"
            data-feedback-placement={placement}
            className={cn(
              'pointer-events-none fixed z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2',
              placementClassName[placement]
            )}
          >
            {items.map((item) => (
              <div
                key={item.id}
                role={item.type === 'error' ? 'alert' : 'status'}
                data-feedback-key={
                  item.key === undefined ? undefined : String(item.key)
                }
                className={cn(
                  'pointer-events-auto grid w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 rounded-xl border p-3 text-popover-foreground shadow-lg',
                  feedbackTone[item.type],
                  item.onClick &&
                    'cursor-pointer outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                  item.className
                )}
                style={item.style}
                tabIndex={item.onClick ? 0 : undefined}
                onClick={(event) => {
                  if (!isNestedInteractiveTarget(event)) {
                    item.onClick?.(event);
                  }
                }}
                onKeyDown={(event) => {
                  if (
                    item.onClick &&
                    event.target === event.currentTarget &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    item.onClick(
                      event as unknown as React.MouseEvent<HTMLDivElement>
                    );
                  }
                }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 [&_svg]:size-4',
                    feedbackIconTone[item.type]
                  )}
                >
                  {item.icon ?? feedbackIcon[item.type]}
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="text-sm font-medium leading-5">
                    {item.message}
                  </div>
                  {item.description && (
                    <div className="text-sm leading-5 text-muted-foreground">
                      {item.description}
                    </div>
                  )}
                  {item.action && (
                    <div className="flex justify-end pt-1">{item.action}</div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={t('关闭')}
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItem(item.id);
                  }}
                >
                  {item.closeIcon ?? <XIcon className="size-3.5" />}
                </button>
              </div>
            ))}
          </div>
        );
      })}

      <TcDialog
        open={activeAlert !== null}
        onOpenChange={(open) => !open && closeAlert()}
        title={t('确认操作')}
      >
        <div className="text-body">{activeAlert?.message}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={confirming}
            onClick={closeAlert}
          >
            {t('取消')}
          </Button>
          <Button
            type="button"
            disabled={confirming}
            aria-busy={confirming}
            onClick={confirmAlert}
          >
            {confirming && <LoaderCircleIcon className="animate-spin" />}
            {t('确认')}
          </Button>
        </div>
      </TcDialog>
    </>
  );
});
FeedbackHost.displayName = 'FeedbackHost';
