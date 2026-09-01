import React from 'react';
import { LoaderCircleIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Button as ShadcnButton,
  buttonVariants,
} from '@/components/ui/official/button';
import { Input as ShadcnInput } from '@/components/ui/official/input';
import { Textarea as ShadcnTextarea } from '@/components/ui/official/textarea';
import { Switch as ShadcnSwitch } from '@/components/ui/official/switch';
import { Separator } from '@/components/ui/official/separator';

type LegacyButtonType = 'default' | 'primary' | 'dashed' | 'link' | 'text';
type LegacyButtonSize = 'small' | 'middle' | 'large';

export interface PluginButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'type'
  > {
  block?: boolean;
  children?: React.ReactNode;
  danger?: boolean;
  ghost?: boolean;
  href?: string;
  htmlType?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  loading?: boolean | { delay?: number };
  shape?: 'default' | 'circle' | 'round';
  size?: LegacyButtonSize;
  target?: React.HTMLAttributeAnchorTarget;
  type?: LegacyButtonType;
}

function getButtonVariant(
  type: LegacyButtonType,
  danger: boolean,
  ghost: boolean
) {
  if (danger) {
    return 'destructive' as const;
  }
  if (ghost || type === 'text') {
    return 'ghost' as const;
  }
  if (type === 'primary') {
    return 'default' as const;
  }
  if (type === 'link') {
    return 'link' as const;
  }
  return 'outline' as const;
}

function getButtonSize(
  size: LegacyButtonSize,
  shape: PluginButtonProps['shape']
) {
  if (shape === 'circle') {
    return {
      small: 'icon-sm',
      middle: 'icon',
      large: 'icon-lg',
    }[size] as 'icon-sm' | 'icon' | 'icon-lg';
  }
  if (size === 'small') {
    return 'sm' as const;
  }
  if (size === 'large') {
    return 'lg' as const;
  }
  return 'default' as const;
}

/**
 * Public plugin Button compatibility facade rendered by the official
 * shadcn/ui Button source. Legacy Ant Design prop names remain accepted so
 * existing plugins inherit the modern Tailchat control language immediately.
 */
export const Button = React.forwardRef<HTMLButtonElement, PluginButtonProps>(
  function PluginButton(
    {
      block = false,
      children,
      className,
      danger = false,
      disabled,
      ghost = false,
      href,
      htmlType = 'button',
      icon,
      loading = false,
      onClick,
      shape = 'default',
      size = 'middle',
      tabIndex,
      target,
      type = 'default',
      ...props
    },
    ref
  ) {
    const isLoading = Boolean(loading);
    const isDisabled = Boolean(disabled || isLoading);
    const variant = getButtonVariant(type, danger, ghost);
    const shadcnSize = getButtonSize(size, shape);
    const content = (
      <>
        {isLoading ? (
          <LoaderCircleIcon
            aria-hidden="true"
            data-icon="inline-start"
            className="animate-spin"
          />
        ) : (
          icon
        )}
        {children}
      </>
    );
    const sharedClassName = cn(
      block && 'w-full',
      shape === 'circle' && 'rounded-full',
      shape === 'round' && 'rounded-full px-4',
      type === 'dashed' && 'border-dashed',
      danger &&
        'bg-destructive text-destructive-foreground hover:bg-danger-hover dark:bg-destructive dark:hover:bg-danger-hover',
      className
    );

    if (href) {
      const handleAnchorClick: React.MouseEventHandler<HTMLAnchorElement> = (
        event
      ) => {
        if (isDisabled) {
          event.preventDefault();
          return;
        }
        (onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>)?.(
          event
        );
      };
      return (
        <a
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
          href={isDisabled ? undefined : href}
          target={target}
          aria-busy={isLoading || undefined}
          aria-disabled={isDisabled || undefined}
          tabIndex={isDisabled ? -1 : tabIndex}
          onClick={handleAnchorClick}
          data-slot="button"
          className={cn(
            buttonVariants({ variant, size: shadcnSize }),
            isDisabled && 'pointer-events-none opacity-50',
            sharedClassName
          )}
        >
          {content}
        </a>
      );
    }

    return (
      <ShadcnButton
        ref={ref}
        type={htmlType}
        variant={variant}
        size={shadcnSize}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={sharedClassName}
        onClick={onClick}
        tabIndex={tabIndex}
        {...props}
      >
        {content}
      </ShadcnButton>
    );
  }
);

type LegacyControlSize = 'small' | 'middle' | 'large';

export interface PluginInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  addonAfter?: React.ReactNode;
  addonBefore?: React.ReactNode;
  allowClear?: boolean;
  bordered?: boolean;
  prefix?: React.ReactNode;
  size?: LegacyControlSize;
  status?: 'error' | 'warning';
  suffix?: React.ReactNode;
  onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>;
}

const inputSizeClassName: Record<LegacyControlSize, string> = {
  small: 'h-7',
  middle: 'h-8',
  large: 'h-9',
};

const PluginInput = React.forwardRef<HTMLInputElement, PluginInputProps>(
  function PluginInput(
    {
      addonAfter,
      addonBefore,
      allowClear = false,
      'aria-label': ariaLabel,
      bordered = true,
      className,
      disabled,
      onChange,
      onKeyDown,
      onPressEnter,
      placeholder,
      prefix,
      size = 'middle',
      status,
      suffix,
      value,
      defaultValue,
      ...props
    },
    forwardedRef
  ) {
    const internalRef = React.useRef<HTMLInputElement | null>(null);
    const [uncontrolledValue, setUncontrolledValue] = React.useState<
      React.InputHTMLAttributes<HTMLInputElement>['value']
    >(defaultValue ?? '');
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : uncontrolledValue;
    const setRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );
    const hasAffix = Boolean(prefix || suffix || allowClear);
    const hasValue = String(currentValue ?? '').length > 0;
    const accessibleName =
      ariaLabel ?? (typeof placeholder === 'string' ? placeholder : undefined);
    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
      event
    ) => {
      onKeyDown?.(event);
      if (event.key === 'Enter' && !event.defaultPrevented) {
        onPressEnter?.(event);
      }
    };
    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (
      event
    ) => {
      if (!isControlled) {
        setUncontrolledValue(event.target.value);
      }
      onChange?.(event);
    };
    const handleClear = () => {
      const input = internalRef.current;
      if (!input) {
        return;
      }
      const event = {
        target: { ...input, value: '' },
        currentTarget: { ...input, value: '' },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      if (!isControlled) {
        setUncontrolledValue('');
      }
      onChange?.(event);
      input.focus();
    };
    const input = (
      <ShadcnInput
        ref={setRef}
        value={currentValue}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={accessibleName}
        aria-invalid={status === 'error' || undefined}
        data-status={status}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          inputSizeClassName[size],
          !bordered && 'border-transparent shadow-none',
          status === 'warning' &&
            'border-amber-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
          hasAffix &&
            'h-full flex-1 rounded-none border-0 bg-transparent px-0 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent',
          className
        )}
        {...props}
      />
    );

    return (
      <span className="inline-flex w-full min-w-0 items-stretch">
        {addonBefore && (
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-control-border bg-muted px-2.5 text-sm text-muted-foreground">
            {addonBefore}
          </span>
        )}
        {hasAffix ? (
          <span
            data-status={status}
            className={cn(
              'inline-flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-control-border bg-transparent px-2.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
              inputSizeClassName[size],
              !bordered && 'border-transparent',
              status === 'error' &&
                'border-destructive ring-3 ring-destructive/20',
              status === 'warning' &&
                'border-amber-500 focus-within:border-amber-500 focus-within:ring-3 focus-within:ring-amber-500/20',
              addonBefore && 'rounded-l-none',
              addonAfter && 'rounded-r-none',
              disabled && 'pointer-events-none opacity-50'
            )}
          >
            {prefix && <span className="text-muted-foreground">{prefix}</span>}
            {input}
            {allowClear && hasValue && !disabled ? (
              <button
                type="button"
                aria-label="Clear input"
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={handleClear}
              >
                <XIcon className="size-3.5" />
              </button>
            ) : (
              suffix && <span className="text-muted-foreground">{suffix}</span>
            )}
          </span>
        ) : (
          React.cloneElement(input, {
            className: cn(
              input.props.className,
              addonBefore && 'rounded-l-none',
              addonAfter && 'rounded-r-none'
            ),
          })
        )}
        {addonAfter && (
          <span className="inline-flex items-center rounded-r-lg border border-l-0 border-control-border bg-muted px-2.5 text-sm text-muted-foreground">
            {addonAfter}
          </span>
        )}
      </span>
    );
  }
);

export interface PluginTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  allowClear?: boolean;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  bordered?: boolean;
  showCount?: boolean;
  status?: 'error' | 'warning';
  onPressEnter?: React.KeyboardEventHandler<HTMLTextAreaElement>;
}

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  PluginTextAreaProps
>(function PluginTextArea(
  {
    allowClear: _allowClear,
    autoSize,
    'aria-label': ariaLabel,
    bordered = true,
    className,
    maxLength,
    onKeyDown,
    onPressEnter,
    placeholder,
    rows,
    showCount = false,
    status,
    value,
    defaultValue,
    ...props
  },
  ref
) {
  const autoSizeConfig = typeof autoSize === 'object' ? autoSize : undefined;
  const contentLength = String(value ?? defaultValue ?? '').length;
  const accessibleName =
    ariaLabel ?? (typeof placeholder === 'string' ? placeholder : undefined);
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    onKeyDown?.(event);
    if (event.key === 'Enter' && !event.defaultPrevented) {
      onPressEnter?.(event);
    }
  };

  const textarea = (
    <ShadcnTextarea
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={autoSizeConfig?.minRows ?? rows}
      aria-label={accessibleName}
      aria-invalid={status === 'error' || undefined}
      data-status={status}
      onKeyDown={handleKeyDown}
      className={cn(
        !bordered && 'border-transparent shadow-none',
        status === 'warning' &&
          'border-amber-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
        showCount && 'pb-6',
        className
      )}
      {...props}
    />
  );

  if (!showCount) {
    return textarea;
  }

  return (
    <span className="relative block w-full">
      {textarea}
      <span className="pointer-events-none absolute right-2.5 bottom-1.5 text-xs tabular-nums text-muted-foreground">
        {contentLength}
        {typeof maxLength === 'number' ? ` / ${maxLength}` : ''}
      </span>
    </span>
  );
});

type PluginInputComponent = typeof PluginInput & { TextArea: typeof TextArea };

export const Input = PluginInput as PluginInputComponent;
Input.TextArea = TextArea;

export interface PluginSwitchProps
  extends Omit<
    React.ComponentProps<typeof ShadcnSwitch>,
    'onCheckedChange' | 'size'
  > {
  checked?: boolean;
  checkedChildren?: React.ReactNode;
  defaultChecked?: boolean;
  loading?: boolean;
  onChange?: (checked: boolean, event?: Event) => void;
  size?: 'default' | 'small';
  unCheckedChildren?: React.ReactNode;
}

export const Switch: React.FC<PluginSwitchProps> = React.memo(
  ({
    checked,
    checkedChildren,
    className,
    defaultChecked,
    disabled,
    loading = false,
    onChange,
    size = 'default',
    unCheckedChildren,
    ...props
  }) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(
      defaultChecked ?? false
    );
    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : uncontrolledChecked;
    const label = currentChecked ? checkedChildren : unCheckedChildren;
    return (
      <span className="inline-flex items-center gap-2">
        <ShadcnSwitch
          checked={currentChecked}
          disabled={disabled || loading}
          size={size === 'small' ? 'sm' : 'default'}
          aria-busy={loading || undefined}
          className={className}
          onCheckedChange={(nextChecked, eventDetails) => {
            if (!isControlled) {
              setUncontrolledChecked(nextChecked);
            }
            onChange?.(nextChecked, eventDetails.event);
          }}
          {...props}
        />
        {loading ? (
          <LoaderCircleIcon
            aria-hidden="true"
            className="size-3.5 animate-spin text-muted-foreground"
          />
        ) : (
          label && <span className="text-sm">{label}</span>
        )}
      </span>
    );
  }
);
Switch.displayName = 'PluginSwitch';

export interface PluginDividerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children?: React.ReactNode;
  dashed?: boolean;
  orientation?: 'left' | 'right' | 'center';
  plain?: boolean;
  type?: 'horizontal' | 'vertical';
}

export const Divider = React.forwardRef<HTMLDivElement, PluginDividerProps>(
  function PluginDivider(
    {
      children,
      className,
      dashed = false,
      orientation = 'center',
      plain = false,
      type = 'horizontal',
      ...props
    },
    ref
  ) {
    if (type === 'vertical') {
      return (
        <Separator
          ref={ref}
          orientation="vertical"
          className={cn('mx-2 inline-flex h-4 align-middle', className)}
          {...props}
        />
      );
    }
    if (!children) {
      return (
        <Separator
          ref={ref}
          className={cn(
            'my-4',
            dashed && 'border-t border-dashed bg-transparent',
            className
          )}
          {...props}
        />
      );
    }
    return (
      <div
        ref={ref}
        role="separator"
        className={cn('my-4 flex items-center gap-3', className)}
        {...props}
      >
        {orientation !== 'left' && (
          <span
            className={cn(
              'h-px bg-border',
              orientation === 'right' ? 'flex-[3]' : 'flex-1',
              dashed && 'border-t border-dashed bg-transparent'
            )}
          />
        )}
        <span className={cn('text-sm font-medium', plain && 'font-normal')}>
          {children}
        </span>
        {orientation !== 'right' && (
          <span
            className={cn(
              'h-px bg-border',
              orientation === 'left' ? 'flex-[3]' : 'flex-1',
              dashed && 'border-t border-dashed bg-transparent'
            )}
          />
        )}
      </div>
    );
  }
);

type SpaceSize = 'small' | 'middle' | 'large' | number | [number, number];

export interface PluginSpaceProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end' | 'center' | 'baseline';
  direction?: 'horizontal' | 'vertical';
  size?: SpaceSize;
  split?: React.ReactNode;
  wrap?: boolean;
}

function getSpaceGap(size: SpaceSize) {
  if (Array.isArray(size)) {
    return `${size[1]}px ${size[0]}px`;
  }
  if (typeof size === 'number') {
    return `${size}px`;
  }
  return { small: '4px', middle: '8px', large: '16px' }[size];
}

export const Space = React.forwardRef<HTMLDivElement, PluginSpaceProps>(
  function PluginSpace(
    {
      align,
      children,
      className,
      direction = 'horizontal',
      size = 'small',
      split,
      style,
      wrap = false,
      ...props
    },
    ref
  ) {
    const childArray = React.Children.toArray(children);
    const content = split
      ? childArray.flatMap((child, index) =>
          index === 0
            ? [child]
            : [
                <span key={`split-${index}`} aria-hidden="true">
                  {split}
                </span>,
                child,
              ]
        )
      : childArray;
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex',
          direction === 'vertical' ? 'flex-col' : 'flex-row',
          wrap && 'flex-wrap',
          align === 'start' && 'items-start',
          align === 'end' && 'items-end',
          align === 'center' && 'items-center',
          align === 'baseline' && 'items-baseline',
          className
        )}
        style={{ gap: getSpaceGap(size), ...style }}
        {...props}
      >
        {content}
      </div>
    );
  }
);
