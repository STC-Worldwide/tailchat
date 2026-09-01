import React, { useCallback, useMemo, useState } from 'react';
import {
  createDMConverse,
  isValidStr,
  removeFriend,
  showAlert,
  showErrorToasts,
  showToasts,
  t,
  useAppDispatch,
  useAppSelector,
  useAsyncRequest,
  useEvent,
  useGlobalConfigStore,
  useUserInfoList,
  useUserSearch,
  userActions,
} from 'tailchat-shared';
import { UserListItem } from '@/components/UserListItem';
import { Button } from '@/components/ui/official/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/official/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';
import { Input } from '@/components/ui/official/input';
import { useNavigate } from 'react-router';
import { closeModal, openModal } from '@/components/Modal';
import { SetFriendNickname } from '@/components/modals/SetFriendNickname';
import { Virtuoso } from 'react-virtuoso';
import {
  EllipsisVerticalIcon,
  MessageSquareIcon,
  SearchIcon,
  SearchXIcon,
  UserPlusIcon,
  UsersRoundIcon,
} from 'lucide-react';
import { FriendActionButton } from './FriendActionButton';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';

/**
 * 好友列表
 */
export const FriendList: React.FC<{
  onSwitchToAddFriend: () => void;
}> = React.memo((props) => {
  const friends = useAppSelector((state) => state.user.friends);
  const friendIds = useMemo(() => friends.map((f) => f.id), [friends]);
  const userInfos = useUserInfoList(friendIds);
  const { searchText, setSearchText, searchResult } = useUserSearch(userInfos);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const portalContainer = useAppPortalContainer();
  const disableAddFriend = useGlobalConfigStore(
    (state) => state.disableAddFriend
  );

  const [, handleCreateConverse] = useAsyncRequest(
    async (targetId: string) => {
      const converse = await createDMConverse([targetId]);
      navigate(`/main/personal/converse/${converse._id}`);
    },
    [navigate]
  );

  const handleSetFriendNickname = useEvent(async (userId: string) => {
    const key = openModal(
      <SetFriendNickname
        userId={userId}
        onSuccess={() => {
          closeModal(key);
        }}
      />
    );
  });

  const handleRemoveFriend = useEvent(async (targetId: string) => {
    showAlert({
      message: t(
        '是否要从自己的好友列表中删除对方? 注意:你不会从对方的好友列表消失'
      ),
      onConfirm: async () => {
        try {
          await removeFriend(targetId);
          showToasts(t('好友删除成功'), 'success');
          dispatch(userActions.removeFriend(targetId));
        } catch (err) {
          showErrorToasts(err);
        }
      },
    });
  });

  if (friends.length === 0) {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersRoundIcon />
          </EmptyMedia>
          <EmptyTitle>{t('暂无好友')}</EmptyTitle>
          <EmptyDescription>{t('添加好友')}</EmptyDescription>
        </EmptyHeader>
        {!disableAddFriend && (
          <EmptyContent>
            <Button onClick={props.onSwitchToAddFriend}>
              <UserPlusIcon data-icon="inline-start" />
              {t('立即添加')}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b bg-background p-3 md:px-5 md:py-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">{t('好友列表')}</h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {friends.length}
          </span>
        </div>
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="h-11 w-full pl-9 md:h-9"
            placeholder={t('搜索好友')}
            aria-label={t('搜索好友')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {searchText.length > 0 && searchResult.length === 0 ? (
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>{t('没有任何搜索结果')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <Virtuoso
            className="h-full"
            data={searchResult}
            itemContent={(index, item) => (
              <UserListItem
                key={item._id}
                userId={item._id}
                actions={[
                  <FriendActionButton
                    key="message"
                    label={t('发送消息')}
                    icon={<MessageSquareIcon />}
                    onClick={() => handleCreateConverse(item._id)}
                  />,
                  <DropdownMenu key="more">
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t('更多')}
                          className="size-11 md:size-8"
                        >
                          <EllipsisVerticalIcon />
                        </Button>
                      }
                    />
                    <DropdownMenuContent
                      portalContainer={portalContainer}
                      align="end"
                      sideOffset={6}
                    >
                      <DropdownMenuItem
                        onClick={() => handleSetFriendNickname(item._id)}
                      >
                        {isValidStr(item.nickname)
                          ? t('更改好友昵称')
                          : t('添加好友昵称')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleRemoveFriend(item._id)}
                      >
                        {t('删除')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>,
                ]}
              />
            )}
          />
        )}
      </div>
    </div>
  );
});
FriendList.displayName = 'FriendList';
