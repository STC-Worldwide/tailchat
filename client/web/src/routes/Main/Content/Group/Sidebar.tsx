import React from 'react';
import { GroupPanelType, isValidStr, useGroupInfo } from 'tailchat-shared';
import { useParams } from 'react-router';
import { GroupHeader } from './GroupHeader';
import { GroupSection } from '@/components/GroupSection';
import { CommonSidebarWrapper } from '@/components/CommonSidebarWrapper';
import { SidebarItem } from './SidebarItem';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from '@/components/ui/official/sidebar';

/**
 * 群组面板侧边栏组件
 */
export const Sidebar: React.FC = React.memo(() => {
  const { groupId = '' } = useParams<{ groupId: string }>();
  const groupInfo = useGroupInfo(groupId);
  const groupPanels = groupInfo?.panels ?? [];

  return (
    <CommonSidebarWrapper data-tc-role="sidebar-group">
      <GroupHeader groupId={groupId} />

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupPanels
                .filter((panel) => !isValidStr(panel.parentId))
                .map((panel) =>
                  panel.type === GroupPanelType.GROUP ? (
                    <GroupSection key={panel.id} header={panel.name}>
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
                    </GroupSection>
                  ) : (
                    <SidebarItem
                      key={panel.id}
                      groupId={groupId}
                      panel={panel}
                    />
                  )
                )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </CommonSidebarWrapper>
  );
});
Sidebar.displayName = 'Sidebar';
