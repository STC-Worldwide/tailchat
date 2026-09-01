import { UserListItem } from '@/components/UserListItem';
import {
  FriendRequest,
  t,
  acceptFriendRequest,
  denyFriendRequest,
  useAsyncRequest,
} from 'tailchat-shared';
import React from 'react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';
import { CheckIcon, InboxIcon, LoaderCircleIcon, XIcon } from 'lucide-react';
import { FriendActionButton } from './FriendActionButton';

export const RequestReceived: React.FC<{
  requests: FriendRequest[];
}> = React.memo((props) => {
  const [{ loading: acceptLoading }, handleAccept] = useAsyncRequest(
    async (requestId) => {
      await acceptFriendRequest(requestId);
    },
    []
  );

  const [{ loading: denyLoading }, handleDeny] = useAsyncRequest(
    async (requestId) => {
      await denyFriendRequest(requestId);
    },
    []
  );

  if (props.requests.length === 0) {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>{t('暂无待处理的好友请求')}</EmptyTitle>
          <EmptyDescription>{t('等待处理的好友请求')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const loading = acceptLoading || denyLoading;

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b px-3 py-3 md:px-5">
        <h2 className="text-sm font-semibold">{t('等待处理的好友请求')}</h2>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {props.requests.length}
        </p>
      </div>
      <div className="px-1 md:px-2">
        {props.requests.map(({ _id, from }) => (
          <UserListItem
            key={from}
            userId={from}
            actions={[
              <FriendActionButton
                key="accept"
                label={t('接受')}
                icon={
                  acceptLoading ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <CheckIcon />
                  )
                }
                disabled={loading}
                onClick={() => handleAccept(_id)}
              />,
              <FriendActionButton
                key="deny"
                label={t('拒绝')}
                variant="destructive"
                icon={
                  denyLoading ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <XIcon />
                  )
                }
                disabled={loading}
                onClick={() => handleDeny(_id)}
              />,
            ]}
          />
        ))}
      </div>
    </div>
  );
});
RequestReceived.displayName = 'RequestReceived';
