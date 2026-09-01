import {
  chatActions,
  ChatConverseState,
  getCachedUserInfo,
  localTrans,
  model,
  useAppDispatch,
  useAsync,
  useAsyncRequest,
  useDMConverseName,
  useUnread,
  useUserId,
} from 'tailchat-shared';
import React from 'react';
import { SidebarItem } from '../SidebarItem';
import _without from 'lodash/without';
import { XIcon } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';
import { cn } from '@/lib/utils';

interface DirectMessageAvatarProps {
  users: Array<{ nickname: string; avatar?: string | null }>;
}

const DirectMessageAvatar: React.FC<DirectMessageAvatarProps> = React.memo(
  ({ users }) => {
    if (users.length <= 1) {
      const user = users[0];

      return (
        <Avatar size="sm">
          <AvatarImage src={user?.avatar || undefined} alt={user?.nickname} />
          <AvatarFallback className="font-medium">
            {user?.nickname?.slice(0, 1).toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
      );
    }

    return (
      <div className="relative size-6" aria-hidden="true">
        {users.slice(0, 2).map((user, index) => (
          <Avatar
            key={`${user.nickname}-${index}`}
            className={cn(
              'absolute size-4 ring-1 ring-sidebar',
              index === 0 ? 'left-0 top-0' : 'bottom-0 right-0'
            )}
          >
            <AvatarImage src={user.avatar || undefined} alt="" />
            <AvatarFallback className="text-[9px] font-medium">
              {user.nickname.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    );
  }
);
DirectMessageAvatar.displayName = 'DirectMessageAvatar';

interface SidebarDMItemProps {
  converse: ChatConverseState;
}
export const SidebarDMItem: React.FC<SidebarDMItemProps> = React.memo(
  (props) => {
    const converse = props.converse;
    const converseId = converse._id;
    const name = useDMConverseName(converse);
    const userId = useUserId();
    const [hasUnread] = useUnread([converseId]);
    const dispatch = useAppDispatch();

    const { value: icon } = useAsync(async () => {
      if (!userId) {
        return;
      }

      const userInfos = await Promise.all(
        _without<string>(converse.members, userId).map((memberUserId) =>
          getCachedUserInfo(memberUserId)
        )
      );

      return <DirectMessageAvatar users={userInfos} />;
    }, [converse.members, userId]);

    const [, handleRemove] = useAsyncRequest(async () => {
      dispatch(chatActions.removeConverse({ converseId }));
      await model.user.removeUserDMConverse(converseId);
    }, [converseId]);

    return (
      <SidebarItem
        key={converseId}
        name={name}
        action={{
          icon: <XIcon />,
          label: localTrans({
            'zh-CN': `移除 ${name}`,
            'en-US': `Remove ${name}`,
          }),
          onClick: (e) => {
            e.stopPropagation();
            e.preventDefault();
            void handleRemove();
          },
        }}
        icon={icon}
        to={`/main/personal/converse/${converseId}`}
        badge={hasUnread}
      />
    );
  }
);
SidebarDMItem.displayName = 'SidebarDMItem';
