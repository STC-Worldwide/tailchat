import React from 'react';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/official/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/official/dropdown-menu';

export interface TcMenuItem {
  key: React.Key;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  type?: 'divider';
  className?: string;
  danger?: boolean;
  disabled?: boolean;
  children?: (TcMenuItem | false | null)[];
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

function getMenuItems(menu: TcDropdownMenu) {
  return (menu.items ?? []).filter(Boolean) as TcMenuItem[];
}

function renderDropdownItems(
  menu: TcDropdownMenu,
  portalContainer: HTMLElement | null
): React.ReactNode {
  return getMenuItems(menu).map((item) => {
    if (item.type === 'divider') {
      return <DropdownMenuSeparator key={item.key} />;
    }

    if (item.children && item.children.filter(Boolean).length > 0) {
      return (
        <DropdownMenuSub key={item.key}>
          <DropdownMenuSubTrigger
            disabled={item.disabled}
            className={item.className}
          >
            {item.icon}
            <span className="min-w-0 flex-1 text-left">{item.label}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent portalContainer={portalContainer}>
            {renderDropdownItems(
              { items: item.children, onClick: menu.onClick },
              portalContainer
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }

    return (
      <DropdownMenuItem
        key={item.key}
        disabled={item.disabled}
        variant={item.danger ? 'destructive' : 'default'}
        className={item.className}
        onClick={() => {
          item.onClick?.();
          menu.onClick?.();
        }}
      >
        {item.icon}
        {item.label}
      </DropdownMenuItem>
    );
  });
}

function renderContextMenuItems(
  menu: TcDropdownMenu,
  portalContainer: HTMLElement | null
): React.ReactNode {
  return getMenuItems(menu).map((item) => {
    if (item.type === 'divider') {
      return <ContextMenuSeparator key={item.key} />;
    }

    if (item.children && item.children.filter(Boolean).length > 0) {
      return (
        <ContextMenuSub key={item.key}>
          <ContextMenuSubTrigger
            disabled={item.disabled}
            className={item.className}
          >
            {item.icon}
            <span className="min-w-0 flex-1 text-left">{item.label}</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent portalContainer={portalContainer}>
            {renderContextMenuItems(
              { items: item.children, onClick: menu.onClick },
              portalContainer
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
      );
    }

    return (
      <ContextMenuItem
        key={item.key}
        disabled={item.disabled}
        variant={item.danger ? 'destructive' : 'default'}
        className={item.className}
        onClick={() => {
          item.onClick?.();
          menu.onClick?.();
        }}
      >
        {item.icon}
        {item.label}
      </ContextMenuItem>
    );
  });
}

export interface TcDropdownProps {
  menu: TcDropdownMenu;
  children: React.ReactElement;
  placement?: TcDropdownPlacement;
  onOpenChange?: (open: boolean) => void;
}

/** Compatibility adapter backed by the official Shadcn Dropdown Menu. */
export const TcDropdown: React.FC<TcDropdownProps> = React.memo(
  ({ menu, children, placement = 'bottomStart', onOpenChange }) => {
    const portalContainer = useAppPortalContainer();
    const { side, align } = placementMap[placement];

    return (
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger render={children} />
        <DropdownMenuContent
          portalContainer={portalContainer}
          side={side}
          align={align}
          sideOffset={6}
          className="min-w-40"
        >
          {renderDropdownItems(menu, portalContainer)}
        </DropdownMenuContent>
      </DropdownMenu>
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

/** Compatibility adapter backed by the official Shadcn Context Menu. */
export const TcContextMenu: React.FC<TcContextMenuProps> = React.memo(
  ({ menu, children, disabled, onOpenChange, className }) => {
    const portalContainer = useAppPortalContainer();

    if (disabled) {
      return children;
    }

    return (
      <ContextMenu disabled={disabled} onOpenChange={onOpenChange}>
        <ContextMenuTrigger className={className} render={children} />
        <ContextMenuContent
          portalContainer={portalContainer}
          className="min-w-40"
        >
          {renderContextMenuItems(menu, portalContainer)}
        </ContextMenuContent>
      </ContextMenu>
    );
  }
);
TcContextMenu.displayName = 'TcContextMenu';
