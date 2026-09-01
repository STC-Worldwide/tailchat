import { UserListItem } from '@/components/UserListItem';
import {
  cancelFriendRequest,
  FriendRequest,
  t,
  useAsyncFn,
} from 'tailchat-shared';
import React from 'react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';
import { LoaderCircleIcon, SendIcon, XIcon } from 'lucide-react';
import { FriendActionButton } from './FriendActionButton';

export const RequestSend: React.FC<{
  requests: FriendRequest[];
}> = React.memo((props) => {
  const [{ loading }, handleCancel] = useAsyncFn(async (requestId) => {
    await cancelFriendRequest(requestId);
  }, []);

  if (props.requests.length === 0) {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SendIcon />
          </EmptyMedia>
          <EmptyTitle>{t('暂无已发送的好友请求')}</EmptyTitle>
          <EmptyDescription>{t('等待对方处理的好友请求')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b px-3 py-3 md:px-5">
        <h2 className="text-sm font-semibold">{t('等待对方处理的好友请求')}</h2>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {props.requests.length}
        </p>
      </div>
      <div className="px-1 md:px-2">
        {props.requests.map(({ _id, to }) => (
          <UserListItem
            key={to}
            userId={to}
            actions={[
              <FriendActionButton
                key="cancel"
                label={t('取消')}
                variant="destructive"
                icon={
                  loading ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <XIcon />
                  )
                }
                disabled={loading}
                onClick={() => handleCancel(_id)}
              />,
            ]}
          />
        ))}
      </div>
    </div>
  );
});
RequestSend.displayName = 'RequestSend';
