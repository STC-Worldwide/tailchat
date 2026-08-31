import React from 'react';
import { Select as BaseSelect } from '@base-ui-components/react/select';
import { Icon } from 'tailchat-design';
import { cn } from '@/lib/utils';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';

/**
 * 基于 Base UI 的 token 化 Select (facelift ui/ 基础组件) — 替代 antd Select
 * (单选场景; 复用现有 popover 层级 z-50, 与 TcDialog/TcTooltip 一致)
 */
export interface TcSelectOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
}

export interface TcSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: TcSelectOption<T>[];
  className?: string;
  triggerClassName?: string;
}

export function TcSelect<T extends string = string>({
  value,
  onChange,
  options,
  className,
  triggerClassName,
}: TcSelectProps<T>) {
  const portalContainer = useAppPortalContainer();

  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(v) => onChange(v as T)}
      items={options.map((o) => ({ value: o.value, label: o.label }))}
    >
      <BaseSelect.Trigger
        className={cn(
          'inline-flex items-center justify-between gap-2 h-9 px-3 rounded-lg',
          'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15',
          'text-body text-sm border border-subtle cursor-pointer select-none',
          'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
          triggerClassName
        )}
      >
        <BaseSelect.Value />
        <Icon icon="mdi:chevron-down" className="text-muted" />
      </BaseSelect.Trigger>
      <BaseSelect.Portal container={portalContainer}>
        <BaseSelect.Positioner className="z-50" sideOffset={4}>
          <BaseSelect.Popup
            className={cn(
              'rounded-lg bg-raised text-body border border-subtle shadow-elevationMedium py-1 min-w-[var(--anchor-width)]',
              className
            )}
          >
            {options.map((o) => (
              <BaseSelect.Item
                key={o.value}
                value={o.value}
                className={cn(
                  'flex items-center justify-between gap-2 px-3 py-1.5 text-sm cursor-pointer select-none',
                  'data-[highlighted]:bg-primary/15'
                )}
              >
                <BaseSelect.ItemText>{o.label}</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
