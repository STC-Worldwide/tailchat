import React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { cn } from '@/lib/utils';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';

export interface TcMenuItem {
  key: React.Key;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: (...args: any[]) => void;
}

export type TcDropdownPlacement =
  | 'bottom'
  | 'bottomStart'
  | 'bottomEnd'
  | 'top'
  | 'topStart'
  | 'topEnd';

const placementMap: Record<
  TcDropdownPlacement,
  { side: 'top' | 'bottom'; align: 'start' | 'center' | 'end' }
> = {
  bottom: { side: 'bottom', align: 'center' },
  bottomStart: { side: 'bottom', align: 'start' },
  bottomEnd: { side: 'bottom', align: 'end' },
  top: { side: 'top', align: 'center' },
  topStart: { side: 'top', align: 'start' },
  topEnd: { side: 'top', align: 'end' },
};

/** 与旧 antd MenuProps 同形状 ({ onClick, items }), 便于沿用现有的构造 hook */
export interface TcDropdownMenu {
  onClick?: (...args: any[]) => void;
  items?: (TcMenuItem | false | null)[];
}

export interface TcDropdownProps {
  menu: TcDropdownMenu;
  children: React.ReactElement;
  placement?: TcDropdownPlacement;
  onOpenChange?: (open: boolean) => void;
}

/**
 * 基于 Base UI 的 token 化 Dropdown 菜单 (facelift ui/ 基础组件) — 替代 antd Dropdown
 * 目前仅支持扁平菜单项 (无子菜单), 覆盖当前 antd MenuProps 消费方的实际用法
 */
export const TcDropdown: React.FC<TcDropdownProps> = React.memo(
  ({ menu, children, placement = 'bottomStart', onOpenChange }) => {
    const portalContainer = useAppPortalContainer();
    const { side, align } = placementMap[placement];
    const items = (menu.items ?? []).filter(Boolean) as TcMenuItem[];

    return (
      <Menu.Root onOpenChange={onOpenChange}>
        <Menu.Trigger render={children} />
        <Menu.Portal container={portalContainer}>
          <Menu.Positioner
            side={side}
            align={align}
            sideOffset={6}
            className="z-50"
          >
            <Menu.Popup className="rounded-lg bg-raised text-body border border-subtle shadow-elevationMedium py-1 min-w-[160px]">
              {items.map((item) => (
                <Menu.Item
                  key={item.key}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.();
                    menu.onClick?.();
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer select-none',
                    'data-[highlighted]:bg-primary/15',
                    'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
                    item.danger && 'text-danger'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    );
  }
);
TcDropdown.displayName = 'TcDropdown';
