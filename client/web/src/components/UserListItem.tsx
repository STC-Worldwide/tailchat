import React from 'react';
import _isEmpty from 'lodash/isEmpty';
import { t, useCachedUserInfo, useCachedOnlineStatus } from 'tailchat-shared';
import { UserName } from './UserName';
import { TcPopover } from './TcPopover';
import { Avatar, AvatarFallback, AvatarImage } from './ui/official/avatar';
import { Skeleton } from './ui/official/skeleton';
import { cn } from '@/lib/utils';

interface UserListItemProps {
  userId: string;
  popover?: React.ReactNode;
  actions?: React.ReactElement[];
  hideDiscriminator?: boolean;
  /**
   * 紧凑版: 矮一档、没有分隔线、hover 是一块圆角而不是整行铺满。
   *
   * 默认那套是给"每行带操作按钮的管理列表"用的 —— 56px 一行、行行一条横线, 放到
   * 成员侧边栏里就是一张表格, 又高又碎。这个组件还导出给插件用, 所以做成可选项而
   * 不是直接改默认值。
   */
  compact?: boolean;
}
export const UserListItem: React.FC<UserListItemProps> = React.memo((props) => {
  const { actions = [], hideDiscriminator = false, compact = false } = props;
  const userInfo = useCachedUserInfo(props.userId);
  const [isOnline] = useCachedOnlineStatus([props.userId]);
  const userName = userInfo.nickname;

  if (_isEmpty(userInfo)) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-3',
          compact ? 'h-11' : 'h-14 border-b border-border/70'
        )}
        role="status"
        aria-label={t('加载中')}
      >
        <Skeleton
          className={cn('shrink-0 rounded-full', compact ? 'size-8' : 'size-9')}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center transition-colors',
        compact
          ? 'mx-1 h-11 rounded-md px-2 hover:bg-accent/50'
          : 'h-14 border-b border-border/70 px-3 last:border-b-0 hover:bg-muted/50'
      )}
    >
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
              <Avatar className={cn(compact ? 'size-8' : 'size-9')}>
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
          <Avatar className={cn(compact ? 'size-8' : 'size-9')}>
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
