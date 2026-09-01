import React from 'react';
import { PackageOpenIcon, XIcon } from 'lucide-react';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/official/badge';
import { Checkbox as ShadcnCheckbox } from '@/components/ui/official/checkbox';
import {
  Empty as ShadcnEmpty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/official/empty';
import {
  Popover as ShadcnPopover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/official/popover';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/official/skeleton';
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/official/tooltip';

export type LegacyPlacement =
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight'
  | 'left'
  | 'leftTop'
  | 'leftBottom'
  | 'right'
  | 'rightTop'
  | 'rightBottom';

function mapPlacement(placement: LegacyPlacement = 'top') {
  const side = placement.startsWith('bottom')
    ? 'bottom'
    : placement.startsWith('left')
    ? 'left'
    : placement.startsWith('right')
    ? 'right'
    : 'top';
  const align =
    placement.endsWith('Left') || placement.endsWith('Top')
      ? 'start'
      : placement.endsWith('Right') || placement.endsWith('Bottom')
      ? 'end'
      : 'center';

  return { side, align } as const;
}

function getTriggerElement(children: React.ReactNode) {
  if (React.isValidElement(children) && supportsTriggerRef(children.type)) {
    return children;
  }

  return (
    <span className="inline-flex" data-plugin-trigger-wrapper="">
      {children}
    </span>
  );
}

function supportsTriggerRef(
  type: string | React.JSXElementConstructor<unknown>
) {
  if (typeof type === 'string') {
    return true;
  }

  const refType = Symbol.for('react.forward_ref');
  const memoType = Symbol.for('react.memo');
  const candidate = type as unknown as {
    $$typeof?: symbol;
    type?: { $$typeof?: symbol };
    prototype?: { isReactComponent?: unknown };
  };

  return (
    candidate.$$typeof === refType ||
    (candidate.$$typeof === memoType && candidate.type?.$$typeof === refType) ||
    Boolean(candidate.prototype?.isReactComponent)
  );
}

export interface PluginCheckboxProps
  extends Omit<
    React.ComponentProps<typeof ShadcnCheckbox>,
    'checked' | 'defaultChecked' | 'onCheckedChange' | 'children'
  > {
  checked?: boolean;
  children?: React.ReactNode;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox = React.forwardRef<HTMLElement, PluginCheckboxProps>(
  function PluginCheckbox(
    {
      checked,
      children,
      className,
      defaultChecked = false,
      disabled,
      indeterminate = false,
      onChange,
      ...props
    },
    ref
  ) {
    const [uncontrolledChecked, setUncontrolledChecked] =
      React.useState(defaultChecked);
    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : uncontrolledChecked;
    const handleCheckedChange = (nextChecked: boolean) => {
      if (!isControlled) {
        setUncontrolledChecked(nextChecked);
      }
      const event = {
        target: { checked: nextChecked },
        currentTarget: { checked: nextChecked },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
    };
    const control = (
      <ShadcnCheckbox
        ref={ref}
        checked={currentChecked}
        disabled={disabled}
        indeterminate={indeterminate}
        onCheckedChange={(nextChecked) =>
          handleCheckedChange(Boolean(nextChecked))
        }
        className={className}
        {...props}
      />
    );

    if (!children) {
      return control;
    }

    return (
      <label
        className={cn(
          'inline-flex cursor-pointer items-center gap-2 text-sm',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {control}
        <span>{children}</span>
      </label>
    );
  }
);

export interface PluginTooltipProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  defaultOpen?: boolean;
  defaultVisible?: boolean;
  destroyTooltipOnHide?: boolean;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  onOpenChange?: (open: boolean) => void;
  onVisibleChange?: (visible: boolean) => void;
  open?: boolean;
  overlayClassName?: string;
  overlayInnerStyle?: React.CSSProperties;
  overlayStyle?: React.CSSProperties;
  placement?: LegacyPlacement;
  title?: React.ReactNode | (() => React.ReactNode);
  visible?: boolean;
}

export const Tooltip: React.FC<PluginTooltipProps> = React.memo(
  ({
    children,
    color,
    defaultOpen,
    defaultVisible,
    getPopupContainer,
    mouseEnterDelay = 0.1,
    mouseLeaveDelay = 0,
    onOpenChange,
    onVisibleChange,
    open,
    overlayClassName,
    overlayInnerStyle,
    overlayStyle,
    placement = 'top',
    title,
    visible,
  }) => {
    const appPortalContainer = useAppPortalContainer();
    const resolvedTitle = typeof title === 'function' ? title() : title;
    const controlledOpen = open ?? visible;
    const { side, align } = mapPlacement(placement);
    const fallbackTrigger =
      typeof document === 'undefined' ? null : document.body;
    const portalContainer =
      (fallbackTrigger && getPopupContainer?.(fallbackTrigger)) ??
      appPortalContainer;

    if (
      resolvedTitle === null ||
      resolvedTitle === undefined ||
      resolvedTitle === ''
    ) {
      return <>{children}</>;
    }

    return (
      <TooltipProvider delay={0}>
        <ShadcnTooltip
          open={controlledOpen}
          defaultOpen={defaultOpen ?? defaultVisible}
          onOpenChange={(nextOpen) => {
            onOpenChange?.(nextOpen);
            onVisibleChange?.(nextOpen);
          }}
        >
          <TooltipTrigger
            render={getTriggerElement(children)}
            delay={mouseEnterDelay * 1000}
            closeDelay={mouseLeaveDelay * 1000}
          />
          <TooltipContent
            side={side}
            align={align}
            portalContainer={portalContainer}
            className={cn(overlayClassName)}
            style={{
              ...(color ? { backgroundColor: color } : undefined),
              ...overlayStyle,
              ...overlayInnerStyle,
            }}
          >
            {resolvedTitle}
          </TooltipContent>
        </ShadcnTooltip>
      </TooltipProvider>
    );
  }
);
Tooltip.displayName = 'PluginTooltip';

export interface PluginPopoverProps {
  children: React.ReactNode;
  className?: string;
  content?: React.ReactNode | (() => React.ReactNode);
  defaultOpen?: boolean;
  defaultVisible?: boolean;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  onOpenChange?: (open: boolean) => void;
  onVisibleChange?: (visible: boolean) => void;
  open?: boolean;
  overlayClassName?: string;
  overlayInnerStyle?: React.CSSProperties;
  overlayStyle?: React.CSSProperties;
  placement?: LegacyPlacement;
  title?: React.ReactNode;
  trigger?: 'click' | 'hover' | 'focus' | 'contextMenu' | string[];
  visible?: boolean;
}

export const Popover: React.FC<PluginPopoverProps> = React.memo(
  ({
    children,
    content,
    defaultOpen,
    defaultVisible,
    getPopupContainer,
    mouseEnterDelay = 0.1,
    mouseLeaveDelay = 0.1,
    onOpenChange,
    onVisibleChange,
    open,
    overlayClassName,
    overlayInnerStyle,
    overlayStyle,
    placement = 'top',
    title,
    trigger = 'hover',
    visible,
  }) => {
    const appPortalContainer = useAppPortalContainer();
    const externalOpen = open ?? visible;
    const isControlled = externalOpen !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
      defaultOpen ?? defaultVisible ?? false
    );
    const currentOpen = isControlled ? externalOpen : uncontrolledOpen;
    const resolvedContent = typeof content === 'function' ? content() : content;
    const triggerList = Array.isArray(trigger) ? trigger : [trigger];
    const { side, align } = mapPlacement(placement);
    const fallbackTrigger =
      typeof document === 'undefined' ? null : document.body;
    const portalContainer =
      (fallbackTrigger && getPopupContainer?.(fallbackTrigger)) ??
      appPortalContainer;
    const baseTriggerElement = getTriggerElement(children);
    const emitOpenChange = (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
      onVisibleChange?.(nextOpen);
    };
    const triggerElement = React.cloneElement(baseTriggerElement, {
      onContextMenu: (event: React.MouseEvent<HTMLElement>) => {
        baseTriggerElement.props.onContextMenu?.(event);
        if (triggerList.includes('contextMenu') && !event.defaultPrevented) {
          event.preventDefault();
          emitOpenChange(true);
        }
      },
      onFocus: (event: React.FocusEvent<HTMLElement>) => {
        baseTriggerElement.props.onFocus?.(event);
        if (triggerList.includes('focus') && !event.defaultPrevented) {
          emitOpenChange(true);
        }
      },
    });

    return (
      <ShadcnPopover
        open={currentOpen}
        onOpenChange={(nextOpen, eventDetails) => {
          const triggerAllowed =
            !nextOpen ||
            (eventDetails.reason === 'trigger-press' &&
              triggerList.includes('click')) ||
            (eventDetails.reason === 'trigger-hover' &&
              triggerList.includes('hover')) ||
            (eventDetails.reason === 'trigger-focus' &&
              triggerList.includes('focus'));

          if (triggerAllowed) {
            emitOpenChange(nextOpen);
          }
        }}
      >
        <PopoverTrigger
          render={triggerElement}
          nativeButton={
            React.isValidElement(children) && children.type === 'button'
          }
          openOnHover={triggerList.includes('hover')}
          delay={mouseEnterDelay * 1000}
          closeDelay={mouseLeaveDelay * 1000}
        />
        <PopoverContent
          side={side}
          align={align}
          portalContainer={portalContainer}
          className={cn(overlayClassName)}
          style={{ ...overlayStyle, ...overlayInnerStyle }}
        >
          {title && (
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
            </PopoverHeader>
          )}
          {resolvedContent}
        </PopoverContent>
      </ShadcnPopover>
    );
  }
);
Popover.displayName = 'PluginPopover';

const tagColorClassName: Record<string, string> = {
  blue: 'bg-primary/15 text-primary',
  cyan: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  geekblue: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  gold: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  lime: 'bg-lime-500/15 text-lime-700 dark:text-lime-300',
  magenta: 'bg-pink-500/15 text-pink-700 dark:text-pink-300',
  orange: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  red: 'bg-destructive/15 text-destructive',
  volcano: 'bg-orange-600/15 text-orange-700 dark:text-orange-300',
  yellow: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300',
};

export interface PluginTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  bordered?: boolean;
  closable?: boolean;
  closeIcon?: React.ReactNode;
  color?: string;
  icon?: React.ReactNode;
  onClose?: (event: React.MouseEvent<HTMLElement>) => void;
}

export const Tag: React.FC<PluginTagProps> = React.memo(
  ({
    bordered = true,
    children,
    className,
    closable = false,
    closeIcon,
    color,
    icon,
    onClose,
    style,
    ...props
  }) => {
    const [visible, setVisible] = React.useState(true);
    if (!visible) {
      return null;
    }

    const presetColor = color ? tagColorClassName[color] : undefined;
    const customColor = color && !presetColor ? color : undefined;
    return (
      <Badge
        variant={bordered ? 'outline' : 'secondary'}
        className={cn(
          'h-auto min-h-5 gap-1 py-0.5',
          presetColor,
          !bordered && 'border-transparent',
          className
        )}
        style={{
          ...(customColor
            ? { borderColor: customColor, color: customColor }
            : undefined),
          ...style,
        }}
        {...props}
      >
        {icon}
        {children}
        {closable && (
          <button
            type="button"
            aria-label="Close tag"
            className="inline-flex size-4 items-center justify-center rounded-full hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(event) => {
              onClose?.(event);
              if (!event.defaultPrevented) {
                setVisible(false);
              }
            }}
          >
            {closeIcon ?? <XIcon className="size-3" />}
          </button>
        )}
      </Badge>
    );
  }
);
Tag.displayName = 'PluginTag';

type SkeletonSize = number | 'small' | 'default' | 'large';

function getSkeletonSize(size: SkeletonSize = 'default') {
  if (typeof size === 'number') {
    return size;
  }
  return { small: 24, default: 32, large: 40 }[size];
}

interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  shape?: 'circle' | 'square';
  size?: SkeletonSize;
}

const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  active = false,
  className,
  shape = 'circle',
  size = 'default',
  style,
  ...props
}) => {
  const resolvedSize = getSkeletonSize(size);
  return (
    <ShadcnSkeleton
      className={cn(
        shape === 'circle' ? 'rounded-full' : 'rounded-md',
        !active && 'animate-none',
        className
      )}
      style={{ width: resolvedSize, height: resolvedSize, ...style }}
      {...props}
    />
  );
};

export interface PluginSkeletonProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  active?: boolean;
  avatar?: boolean | SkeletonAvatarProps;
  loading?: boolean;
  paragraph?: boolean | { rows?: number; width?: number | string };
  round?: boolean;
  title?: boolean | { width?: number | string };
}

const PluginSkeleton: React.FC<PluginSkeletonProps> = React.memo(
  ({
    active = false,
    avatar = false,
    children,
    className,
    loading = true,
    paragraph = true,
    round = false,
    title = true,
    ...props
  }) => {
    if (!loading) {
      return <>{children}</>;
    }
    const avatarProps = typeof avatar === 'object' ? avatar : {};
    const titleConfig = typeof title === 'object' ? title : undefined;
    const paragraphConfig =
      typeof paragraph === 'object' ? paragraph : undefined;
    const rows = paragraphConfig?.rows ?? 3;

    return (
      <div
        role="status"
        aria-label="Loading"
        className={cn('flex w-full items-start gap-3', className)}
        {...props}
      >
        {avatar && <SkeletonAvatar active={active} {...avatarProps} />}
        <div className="min-w-0 flex-1 space-y-2">
          {title && (
            <ShadcnSkeleton
              className={cn(
                'h-4 w-2/5',
                round && 'rounded-full',
                !active && 'animate-none'
              )}
              style={
                titleConfig?.width ? { width: titleConfig.width } : undefined
              }
            />
          )}
          {paragraph &&
            Array.from({ length: rows }).map((_, index) => (
              <ShadcnSkeleton
                key={index}
                className={cn(
                  'h-3',
                  index === rows - 1 ? 'w-3/5' : 'w-full',
                  round && 'rounded-full',
                  !active && 'animate-none'
                )}
                style={
                  paragraphConfig?.width
                    ? { width: paragraphConfig.width }
                    : undefined
                }
              />
            ))}
        </div>
      </div>
    );
  }
);

const SkeletonButton: React.FC<SkeletonAvatarProps> = ({
  active = false,
  className,
  size = 'default',
  style,
  ...props
}) => (
  <ShadcnSkeleton
    className={cn('w-20 rounded-lg', !active && 'animate-none', className)}
    style={{ height: getSkeletonSize(size), ...style }}
    {...props}
  />
);
const SkeletonInput: React.FC<SkeletonAvatarProps> = ({
  active = false,
  className,
  size = 'default',
  style,
  ...props
}) => (
  <ShadcnSkeleton
    className={cn('w-44 rounded-lg', !active && 'animate-none', className)}
    style={{ height: getSkeletonSize(size), ...style }}
    {...props}
  />
);
const SkeletonImage: React.FC<SkeletonAvatarProps> = (props) => (
  <SkeletonAvatar {...props} shape="square" size={props.size ?? 96} />
);

type PluginSkeletonComponent = typeof PluginSkeleton & {
  Avatar: typeof SkeletonAvatar;
  Button: typeof SkeletonButton;
  Image: typeof SkeletonImage;
  Input: typeof SkeletonInput;
  Node: typeof ShadcnSkeleton;
};

export const Skeleton = PluginSkeleton as PluginSkeletonComponent;
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Button = SkeletonButton;
Skeleton.Image = SkeletonImage;
Skeleton.Input = SkeletonInput;
Skeleton.Node = ShadcnSkeleton;

export interface PluginEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  description?: React.ReactNode;
  image?: React.ReactNode;
  imageStyle?: React.CSSProperties;
  prefixCls?: string;
}

const PluginEmpty: React.FC<PluginEmptyProps> = React.memo(
  ({
    children,
    className,
    description,
    image,
    imageStyle,
    prefixCls: _prefixCls,
    ...props
  }) => {
    const media =
      typeof image === 'string' ? (
        <img src={image} alt="" className="max-h-full max-w-full" />
      ) : (
        image ?? <PackageOpenIcon />
      );

    return (
      <ShadcnEmpty
        role="status"
        className={cn('min-h-28', className)}
        {...props}
      >
        <EmptyHeader>
          <EmptyMedia variant="icon" style={imageStyle}>
            {media}
          </EmptyMedia>
          {description && <EmptyDescription>{description}</EmptyDescription>}
        </EmptyHeader>
        {children && <EmptyContent>{children}</EmptyContent>}
      </ShadcnEmpty>
    );
  }
);

type PluginEmptyComponent = typeof PluginEmpty & {
  PRESENTED_IMAGE_DEFAULT: React.ReactNode;
  PRESENTED_IMAGE_SIMPLE: React.ReactNode;
};

export const Empty = PluginEmpty as PluginEmptyComponent;
Empty.PRESENTED_IMAGE_DEFAULT = <PackageOpenIcon />;
Empty.PRESENTED_IMAGE_SIMPLE = <PackageOpenIcon />;
