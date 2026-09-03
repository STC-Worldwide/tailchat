import React from 'react';
import { GroupPanelType, isValidStr, useGroupInfo } from 'tailchat-shared';
import { useParams } from 'react-router';
import { GroupHeader } from './GroupHeader';
import { CommonSidebarWrapper } from '@/components/CommonSidebarWrapper';
import { SidebarItem } from './SidebarItem';
import { SidebarCategory } from './SidebarCategory';
import { PanelDragProvider } from './usePanelDrag';
import { usePanelManageActions } from './usePanelManageActions';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from '@/components/ui/official/sidebar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/official/context-menu';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';

/**
 * 群组面板侧边栏组件
 */
export const Sidebar: React.FC = React.memo(() => {
  const { groupId = '' } = useParams<{ groupId: string }>();
  const groupInfo = useGroupInfo(groupId);
  const groupPanels = groupInfo?.panels ?? [];
  const portalContainer = useAppPortalContainer();
  const { rootItems } = usePanelManageActions(groupId);

  const backgroundItems = rootItems();

  const list = (
    <SidebarContent className="gap-0">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {groupPanels
              .filter((panel) => !isValidStr(panel.parentId))
              .map((panel) =>
                panel.type === GroupPanelType.GROUP ? (
                  <SidebarCategory
                    key={panel.id}
                    groupId={groupId}
                    panel={panel}
                  >
                    {groupPanels
                      .filter((sub) => sub.parentId === panel.id)
                      .map((sub) => (
                        <SidebarItem
                          key={sub.id}
                          groupId={groupId}
                          panel={sub}
                          nested
                        />
                      ))}
                  </SidebarCategory>
                ) : (
                  <SidebarItem key={panel.id} groupId={groupId} panel={panel} />
                )
              )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );

  return (
    <CommonSidebarWrapper data-tc-role="sidebar-group">
      <GroupHeader groupId={groupId} />

      <PanelDragProvider groupId={groupId}>
        {backgroundItems.length === 0 ? (
          list
        ) : (
          // 空白处右键新建, 这样第一个频道也不必去设置里建
          <ContextMenu>
            <ContextMenuTrigger
              className="contents"
              render={<div className="contents">{list}</div>}
            />
            <ContextMenuContent
              portalContainer={portalContainer}
              className="min-w-44"
            >
              {backgroundItems.map((item) => (
                <ContextMenuItem key={item.key} onClick={item.onClick}>
                  {item.icon}
                  {item.label}
                </ContextMenuItem>
              ))}
            </ContextMenuContent>
          </ContextMenu>
        )}
      </PanelDragProvider>
    </CommonSidebarWrapper>
  );
});
Sidebar.displayName = 'Sidebar';
