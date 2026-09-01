import { openModal } from '@/components/Modal';
import { ModalCreateGroup } from '@/components/modals/CreateGroup';
import React, { useMemo, useRef } from 'react';
import {
  GroupInfo,
  showSuccessToasts,
  t,
  useAppSelector,
  useEvent,
  useGlobalConfigStore,
  useGroupAck,
  useSingleUserSetting,
} from 'tailchat-shared';
import { NavbarNavItem } from './NavItem';
import { useGroupUnreadState } from '@/hooks/useGroupUnreadState';
import { pluginCustomPanel } from '@/plugin/common';
import { NavbarCustomNavItem } from './CustomNavItem';
import SortableList, { SortableItem } from 'react-easy-sort';
import arrayMove from 'array-move';
import { MessageSquareDotIcon, PlusIcon } from 'lucide-react';
import { SidebarMenu } from '@/components/ui/official/sidebar';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/official/context-menu';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';

/**
 * 群组导航栏栏项
 */
const GroupNavItem: React.FC<{ group: GroupInfo }> = React.memo(({ group }) => {
  const groupId = group._id;
  const unreadState = useGroupUnreadState(groupId);
  const { markGroupAllAck } = useGroupAck(groupId);
  const portalContainer = useAppPortalContainer();

  const handleMarkAsRead = () => {
    markGroupAllAck();
    showSuccessToasts(t('已标记该群组所有消息已读'));
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div>
            <NavbarNavItem
              name={group.name}
              label={group.name}
              to={`/main/group/${group._id}`}
              showPill={true}
              badge={['muted', 'unread'].includes(unreadState)}
              badgeProps={{
                status: unreadState === 'unread' ? 'error' : 'default',
              }}
            >
              <Avatar size="sm" className="rounded-md after:rounded-md">
                <AvatarImage
                  src={group.avatar || undefined}
                  alt={group.name}
                  className="rounded-md"
                />
                <AvatarFallback className="rounded-md text-xs font-medium">
                  {group.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </NavbarNavItem>
          </div>
        }
      />
      <ContextMenuContent
        portalContainer={portalContainer}
        className="min-w-40"
      >
        <ContextMenuItem onClick={handleMarkAsRead}>
          <MessageSquareDotIcon />
          {t('标记为已读')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});
GroupNavItem.displayName = 'GroupNavItem';

function useGroupList() {
  const groups = useAppSelector((state) => state.group.groups);
  const { value: groupOrderList = [], setValue: setGroupOrderList } =
    useSingleUserSetting('groupOrderList', []);

  const handleSortEnd = useEvent((oldIndex: number, newIndex: number) => {
    setGroupOrderList(
      arrayMove(
        groupList.map((item) => item._id),
        oldIndex,
        newIndex
      )
    );
  });

  const groupList = useMemo(
    () =>
      Object.values(groups).sort((a, b) => {
        const aIndex = groupOrderList.findIndex((item) => item === a._id);
        const bIndex = groupOrderList.findIndex((item) => item === b._id);

        // 两种情况，在排序列表中则按照排序列表排序
        // 不在排序列表中则放在最前面
        return aIndex - bIndex;
      }),
    [groups, groupOrderList]
  );
  return {
    handleSortEnd,
    groupList,
  };
}

export const GroupNav: React.FC = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { groupList, handleSortEnd } = useGroupList();

  const handleCreateGroup = useEvent(() => {
    openModal(<ModalCreateGroup />, { closable: true });
  });

  const { disableCreateGroup } = useGlobalConfigStore((state) => ({
    disableCreateGroup: state.disableCreateGroup,
  }));

  return (
    <div data-tc-role="navbar-groups" ref={containerRef}>
      {Array.isArray(groupList) && (
        <SortableList
          className="space-y-1"
          lockAxis="y"
          onSortEnd={handleSortEnd}
          customHolderRef={containerRef}
        >
          {groupList.map((group) => (
            <SortableItem key={group._id}>
              <SidebarMenu>
                <GroupNavItem group={group} />
              </SidebarMenu>
            </SortableItem>
          ))}
        </SortableList>
      )}

      <SidebarMenu className="mt-1">
        {!disableCreateGroup && (
          <NavbarNavItem
            name={t('创建群组')}
            label={t('创建群组')}
            onClick={handleCreateGroup}
            data-testid="create-group"
          >
            <PlusIcon />
          </NavbarNavItem>
        )}

        {pluginCustomPanel
          .filter((p) => p.position === 'navbar-group')
          .map((p) => (
            <NavbarCustomNavItem key={p.name} panelInfo={p} withBg={true} />
          ))}
      </SidebarMenu>
    </div>
  );
});
GroupNav.displayName = 'GroupNav';
