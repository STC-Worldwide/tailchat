import React from 'react';
import { Avatar } from 'tailchat-design';
import { useCachedUserInfo } from 'tailchat-shared';

interface UserAvatarProps extends React.ComponentProps<typeof Avatar> {
  userId: string;
}

/**
 * 用户头像组件
 */
export const UserAvatar: React.FC<UserAvatarProps> = React.memo((props) => {
  const { userId, ...avatarProps } = props;
  const cachedUserInfo = useCachedUserInfo(userId);

  return (
    <Avatar
      {...avatarProps}
      src={cachedUserInfo.avatar}
      name={cachedUserInfo.nickname}
    />
  );
});
UserAvatar.displayName = 'UserAvatar';
