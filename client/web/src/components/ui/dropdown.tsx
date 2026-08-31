import React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { ContextMenu } from '@base-ui-components/react/context-menu';
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

function renderMenuItems(menu: TcDropdownMenu) {
  const items = (menu.items ?? []).filter(Boolean) as TcMenuItem[];

  return items.map((item) => (
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
  ));
}

const popupClassName =
  'rounded-lg bg-raised text-body border border-subtle shadow-elevationMedium py-1 min-w-[160px]';

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
            <Menu.Popup className={popupClassName}>
              {renderMenuItems(menu)}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    );
  }
);
TcDropdown.displayName = 'TcDropdown';

export interface TcContextMenuProps {
  menu: TcDropdownMenu;
  children: React.ReactElement;
  /** 对应旧 antd Dropdown 的 disabled — 关闭右键菜单时使用 */
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * 基于 Base UI ContextMenu 的 token 化右键菜单 (facelift ui/ 基础组件) — 替代
 * antd Dropdown trigger={['contextMenu']}。ContextMenuTrigger 自带光标定位,
 * 不需要手动算 anchor。
 *
 * Base UI 1.0.0-rc.0 的 ContextMenuTrigger.handleContextMenu 不读取
 * Root 的 disabled 状态 (只影响其他交互路径), 传 disabled 无法真正阻止右键菜单弹出。
 * disabled 时直接跳过 ContextMenu 包裹, 原样渲染子节点。
 */
export const TcContextMenu: React.FC<TcContextMenuProps> = React.memo(
  ({ menu, children, disabled, onOpenChange, className }) => {
    const portalContainer = useAppPortalContainer();

    if (disabled) {
      return children;
    }

    return (
      <ContextMenu.Root disabled={disabled} onOpenChange={onOpenChange}>
        <ContextMenu.Trigger className={className} render={children} />
        <ContextMenu.Portal container={portalContainer}>
          <ContextMenu.Positioner className="z-50">
            <ContextMenu.Popup className={popupClassName}>
              {renderMenuItems(menu)}
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    );
  }
);
TcContextMenu.displayName = 'TcContextMenu';
