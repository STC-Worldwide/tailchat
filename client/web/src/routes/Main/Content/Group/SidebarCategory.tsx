import React, { PropsWithChildren } from 'react';
import type { GroupPanel } from 'tailchat-shared';
import { ChevronRightIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/official/collapsible';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/official/sidebar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/official/context-menu';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import { panelDropClassName, usePanelDragHandlers } from './usePanelDrag';
import { usePanelManageActions } from './usePanelManageActions';

/**
 * 侧边栏里的面板分组。
 *
 * 和频道一样能拖能右键: 分组自己可以在顶层挪位置(带着子频道一起走), 也可以
 * 作为放置目标把频道收进来。
 *
 * 这里没有复用 GroupSection: 右键菜单和拖拽都只能作用在标题行上。包住整个
 * 分组的话, 右键里面的频道会弹出分组的菜单, 拖拽也会被父级抢走。
 */
export const SidebarCategory: React.FC<
  PropsWithChildren<{
    groupId: string;
    panel: GroupPanel;
  }>
> = React.memo((props) => {
  const { groupId, panel } = props;
  const portalContainer = useAppPortalContainer();
  const { itemsFor } = usePanelManageActions(groupId);
  const { dragProps, isDragging, dropEdge, dropInside } =
    usePanelDragHandlers(panel);

  const menuItems = itemsFor(panel).filter((item) => item.type !== 'divider');

  const header = (
    <div
      className={panelDropClassName({ isDragging, dropEdge, dropInside })}
      {...dragProps}
    >
      <CollapsibleTrigger render={<SidebarMenuButton />}>
        <ChevronRightIcon className="transition-transform group-data-open/collapsible:rotate-90" />
        <span>{panel.name}</span>
      </CollapsibleTrigger>
    </div>
  );

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        {/* 没有管理权限时不挂菜单, 免得右键弹出一个空框 */}
        {menuItems.length === 0 ? (
          header
        ) : (
          <ContextMenu>
            <ContextMenuTrigger
              className="contents"
              render={<div className="contents">{header}</div>}
            />
            <ContextMenuContent
              portalContainer={portalContainer}
              className="min-w-44"
            >
              {menuItems.map((item) => (
                <ContextMenuItem
                  key={item.key}
                  disabled={item.disabled}
                  onClick={item.onClick}
                >
                  {item.icon}
                  {item.label}
                </ContextMenuItem>
              ))}
            </ContextMenuContent>
          </ContextMenu>
        )}
        <CollapsibleContent>
          <SidebarMenuSub>{props.children}</SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
});
SidebarCategory.displayName = 'SidebarCategory';
