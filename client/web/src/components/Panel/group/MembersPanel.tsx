import { UserListItem } from '@/components/UserListItem';
import React, { useMemo } from 'react';
import {
  getGroupConfigWithInfo,
  localTrans,
  t,
  useCachedOnlineStatus,
  useGroupInfo,
  UserBaseInfo,
} from 'tailchat-shared';
import { Problem } from '@/components/Problem';
import { useGroupMemberAction } from '@/hooks/useGroupMemberAction';
import { UserPopover } from '@/components/popover/UserPopover';
import { GroupMemberContextMenuItems } from '@/components/GroupMemberActionMenu';
import { GroupedVirtuoso } from 'react-virtuoso';
import _take from 'lodash/take';
import _sum from 'lodash/sum';
import _get from 'lodash/get';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/official/context-menu';
import { Input } from '@/components/ui/official/input';
import { Skeleton } from '@/components/ui/official/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';
import { SearchIcon, SearchXIcon } from 'lucide-react';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import { buildMemberGroups, filterMembersByPanel } from './memberGroups';

interface MembersPanelProps {
  groupId: string;
  /**
   * 当前选中的频道。
   *
   * 传了就只列出在这个频道里有 `core.viewPanel` 的人 —— 和左边频道列表隐藏频道用
   * 的是同一个判断。不传则列出群组全部成员。
   */
  panelId?: string;
}

/**
 * 用户面板
 */
export const MembersPanel: React.FC<MembersPanelProps> = React.memo((props) => {
  const { groupId, panelId } = props;
  const groupInfo = useGroupInfo(groupId);
  const members = groupInfo?.members ?? [];
  const membersOnlineStatus = useCachedOnlineStatus(
    members.map((m) => m.userId)
  );
  const { hideGroupMemberDiscriminator } = getGroupConfigWithInfo(groupInfo);

  const {
    userInfos,
    searchText,
    setSearchText,
    isSearching,
    searchResult: filteredGroupMembers,
    generateActionMenu,
  } = useGroupMemberAction(groupId);
  const portalContainer = useAppPortalContainer();

  /**
   * 按 userId 查在线状态。
   *
   * `membersOnlineStatus` 是跟着 `groupInfo.members` 的下标走的, 而要分组的是
   * `userInfos` —— 两个数组同序只是巧合, 按 id 查才不会有人被标成假的离线。
   */
  const isOnline = useMemo(() => {
    const online = new Set(
      members
        .filter((_, index) => membersOnlineStatus[index] === true)
        .map((m) => m.userId)
    );

    return (userId: string) => online.has(userId);
  }, [members, membersOnlineStatus]);

  const memberGroups = useMemo(() => {
    if (isSearching) {
      return [
        {
          key: 'search',
          label: localTrans({
            'zh-CN': '搜索结果',
            'en-US': 'Search results',
          }),
          members: filterMembersByPanel(
            groupInfo,
            panelId,
            filteredGroupMembers
          ),
        },
      ];
    }

    return buildMemberGroups({
      groupInfo,
      panelId,
      members: userInfos,
      isOnline,
      labels: { online: t('在线'), offline: t('离线') },
    });
  }, [
    isSearching,
    filteredGroupMembers,
    groupInfo,
    panelId,
    userInfos,
    isOnline,
  ]);

  const { groupCounts, groupNames, getGroupedMemberInfo } = useMemo(() => {
    const groupCounts = memberGroups.map((group) => group.members.length);
    const groupNames = memberGroups.map((group) => group.label);

    const getGroupedMemberInfo = (
      index: number,
      groupIndex: number
    ): UserBaseInfo | null => {
      const prevIndexCount = _sum(_take(groupCounts, groupIndex));

      return _get(
        memberGroups,
        [groupIndex, 'members', index - prevIndexCount],
        null
      );
    };

    return { groupCounts, groupNames, getGroupedMemberInfo };
  }, [memberGroups]);

  if (!groupInfo) {
    return <Problem />;
  }

  if (userInfos.length === 0) {
    return (
      <div className="space-y-4 p-4" role="status" aria-label={t('加载中')}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const renderUser = (member: UserBaseInfo | null) => {
    if (!member) {
      return <div />;
    }

    const menu = generateActionMenu(member);
    if ((menu.items ?? []).length > 0) {
      return (
        <ContextMenu key={member._id}>
          <ContextMenuTrigger
            render={
              <div>
                <UserListItem
                  userId={member._id}
                  popover={<UserPopover userInfo={member} />}
                  hideDiscriminator={hideGroupMemberDiscriminator}
                />
              </div>
            }
          />
          <ContextMenuContent
            portalContainer={portalContainer}
            className="min-w-44"
          >
            <GroupMemberContextMenuItems
              items={menu.items}
              portalContainer={portalContainer}
            />
          </ContextMenuContent>
        </ContextMenu>
      );
    } else {
      return (
        <UserListItem
          key={member._id}
          userId={member._id}
          popover={<UserPopover userInfo={member} />}
          hideDiscriminator={hideGroupMemberDiscriminator}
        />
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b bg-background p-3">
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="h-11 w-full pl-9 md:h-9"
            placeholder={t('搜索成员')}
            aria-label={t('搜索成员')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {isSearching && filteredGroupMembers.length === 0 ? (
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>{t('没有任何搜索结果')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <GroupedVirtuoso
            className="h-full"
            groupCounts={groupCounts}
            groupContent={(index) => {
              return (
                <div className="border-b bg-muted/70 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                  {groupNames[index]} · {groupCounts[index]}
                </div>
              );
            }}
            itemContent={(i, groupIndex) =>
              renderUser(getGroupedMemberInfo(i, groupIndex))
            }
          />
        )}
      </div>
    </div>
  );
});
MembersPanel.displayName = 'MembersPanel';
