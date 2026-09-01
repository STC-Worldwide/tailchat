import { UserListItem } from '@/components/UserListItem';
import { useGroupMemberAction } from '@/hooks/useGroupMemberAction';
import { GroupMemberDropdownItems } from '@/components/GroupMemberActionMenu';
import { Button } from '@/components/ui/official/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/official/dropdown-menu';
import { Input } from '@/components/ui/official/input';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';
import React from 'react';
import { t, UserBaseInfo } from 'tailchat-shared';
import { Virtuoso } from 'react-virtuoso';
import { MoreVerticalIcon, SearchIcon } from 'lucide-react';
import { GroupDetailPage, GroupDetailSection } from './Layout';

/**
 * 群组成员管理
 */
export const GroupMember: React.FC<{ groupId: string }> = React.memo(
  (props) => {
    const groupId = props.groupId;
    const {
      userInfos,
      searchText,
      setSearchText,
      isSearching,
      searchResult: filteredGroupMembers,
      generateActionMenu,
    } = useGroupMemberAction(groupId);
    const portalContainer = useAppPortalContainer();

    const renderUser = (member: UserBaseInfo) => {
      const menu = generateActionMenu(member);

      const actions = menu.items.length
        ? [
            <DropdownMenu key="more">
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 md:size-8"
                    aria-label={t('更多操作')}
                  >
                    <MoreVerticalIcon />
                  </Button>
                }
              />
              <DropdownMenuContent
                portalContainer={portalContainer}
                side="bottom"
                align="end"
                sideOffset={6}
                className="min-w-44"
              >
                <GroupMemberDropdownItems
                  items={menu.items}
                  portalContainer={portalContainer}
                />
              </DropdownMenuContent>
            </DropdownMenu>,
          ]
        : undefined;

      return (
        <UserListItem key={member._id} userId={member._id} actions={actions} />
      );
    };

    return (
      <GroupDetailPage
        title={t('成员管理')}
        description={t('查找成员并管理他们在当前群组中的访问权限。')}
      >
        <GroupDetailSection
          title={t('群组成员')}
          description={
            <>
              {t('当前群组成员数')}: {userInfos.length}
            </>
          }
          action={
            <div className="relative w-64 max-w-full">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                aria-label={t('搜索成员')}
                placeholder={t('搜索成员')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          }
        >
          <div className="h-[min(32rem,55vh)] overflow-hidden rounded-lg border border-border">
            <Virtuoso
              className="h-full"
              data={isSearching ? filteredGroupMembers : userInfos}
              itemContent={(index, item) => renderUser(item)}
            />
          </div>
        </GroupDetailSection>
      </GroupDetailPage>
    );
  }
);
GroupMember.displayName = 'GroupMember';
