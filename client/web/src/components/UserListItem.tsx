import React from 'react';
import _isEmpty from 'lodash/isEmpty';
import { t, useCachedUserInfo, useCachedOnlineStatus } from 'tailchat-shared';
import { UserName } from './UserName';
import { TcPopover } from './TcPopover';
import { Avatar, AvatarFallback, AvatarImage } from './ui/official/avatar';
import { Skeleton } from './ui/official/skeleton';

interface UserListItemProps {
  userId: string;
  popover?: React.ReactNode;
  actions?: React.ReactElement[];
  hideDiscriminator?: boolean;
}
export const UserListItem: React.FC<UserListItemProps> = React.memo((props) => {
  const { actions = [], hideDiscriminator = false } = props;
  const userInfo = useCachedUserInfo(props.userId);
  const [isOnline] = useCachedOnlineStatus([props.userId]);
  const userName = userInfo.nickname;

  if (_isEmpty(userInfo)) {
    return (
      <div
        className="flex h-14 items-center gap-3 border-b border-border/70 px-3"
        role="status"
        aria-label={t('加载中')}
      >
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="group flex h-14 items-center border-b border-border/70 px-3 transition-colors last:border-b-0 hover:bg-muted/50">
      <div className="relative mr-3 shrink-0">
        {props.popover ? (
          <TcPopover
            content={props.popover}
            placement="left"
            nativeButton={true}
          >
            <button
              type="button"
              aria-label={userName}
              className="cursor-pointer rounded-full border-0 bg-transparent p-0 leading-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-9">
                <AvatarImage
                  src={userInfo.avatar ?? undefined}
                  alt={userName ?? ''}
                />
                <AvatarFallback>
                  {userName?.slice(0, 1).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </button>
          </TcPopover>
        ) : (
          <Avatar className="size-9">
            <AvatarImage
              src={userInfo.avatar ?? undefined}
              alt={userName ?? ''}
            />
            <AvatarFallback>
              {userName?.slice(0, 1).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        )}
        <span
          className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-background bg-muted-foreground data-[online=true]:bg-emerald-500"
          data-online={isOnline}
          aria-hidden="true"
        />
        <span className="sr-only" role="status">
          {isOnline ? t('在线') : t('离线')}
        </span>
      </div>
      <div className="min-w-0 flex-1 text-foreground">
        <UserName
          userId={props.userId}
          showDiscriminator={!hideDiscriminator}
        />
      </div>
      <div className="flex items-center gap-1">{actions}</div>
    </div>
  );
});
UserListItem.displayName = 'UserListItem';
