import { IconBtn } from '@/components/IconBtn';
import { UserName } from '@/components/UserName';
import { fetchImagePrimaryColor } from '@/utils/image-helper';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getTextColorHex } from 'tailchat-design';
import {
  createDMConverse,
  getGroupConfigWithInfo,
  GroupInfo,
  t,
  useAsyncRequest,
  UserBaseInfo,
  useUserId,
} from 'tailchat-shared';
import { UserProfileContainer } from '../../UserProfileContainer';
import { usePluginUserExtraInfo } from './usePluginUserExtraInfo';
import { TcTag } from '@/components/ui/tag';
import { TcTooltip } from '@/components/ui/tooltip';

export const GroupUserPopover: React.FC<{
  userInfo: UserBaseInfo;
  groupInfo: GroupInfo;
}> = React.memo((props) => {
  const { userInfo, groupInfo } = props;
  const userId = userInfo._id;
  const userExtra = userInfo.extra ?? {};
  const roleNames = getUserRoleNames(userId, groupInfo);
  const { hideGroupMemberDiscriminator, disableCreateConverseFromGroup } =
    getGroupConfigWithInfo(groupInfo);
  const pluginUserExtraInfoEl = usePluginUserExtraInfo(userExtra);
  const navigate = useNavigate();
  const currentUserId = useUserId();

  const allowSendMessage =
    !hideGroupMemberDiscriminator &&
    !disableCreateConverseFromGroup &&
    currentUserId !== userId;

  const [, handleCreateConverse] = useAsyncRequest(async () => {
    const converse = await createDMConverse([userId]);
    navigate(`/main/personal/converse/${converse._id}`);
  }, [navigate]);

  useEffect(() => {
    if (userInfo.avatar) {
      fetchImagePrimaryColor(userInfo.avatar).then((rgba) => {
        console.log('fetchImagePrimaryColor', rgba);
      });
    }
  }, [userInfo.avatar]);

  return (
    <div className="w-80 -mx-4 -my-3 bg-inherit">
      <UserProfileContainer userInfo={userInfo}>
        <div className="text-xl">
          <span className="font-semibold">
            <UserName userId={userId} />
          </span>
          {!hideGroupMemberDiscriminator && (
            <span className="opacity-60 ml-1">#{userInfo.discriminator}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 py-1">
          {groupInfo.owner === userId && <TcTag variant="warning">{t('创建者')}</TcTag>}

          {userInfo.type === 'openapiBot' && (
            <TcTag variant="warning">{t('开放平台机器人')}</TcTag>
          )}

          {userInfo.type === 'pluginBot' && (
            <TcTag variant="warning">{t('插件机器人')}</TcTag>
          )}

          {userInfo.temporary && <TcTag>{t('游客')}</TcTag>}

          {roleNames.map((name) => (
            <TcTag key={name} style={{ color: getTextColorHex(name) }}>
              {name}
            </TcTag>
          ))}
        </div>

        <div className="pt-2">{pluginUserExtraInfoEl}</div>

        <div className="text-right">
          {allowSendMessage && (
            <TcTooltip label={t('发送消息')}>
              <IconBtn
                icon="mdi:message-processing-outline"
                onClick={handleCreateConverse}
              />
            </TcTooltip>
          )}
        </div>
      </UserProfileContainer>
    </div>
  );
});
GroupUserPopover.displayName = 'GroupUserPopover';

/**
 * 获取用户的角色名列表
 */
function getUserRoleNames(userId: string, groupInfo: GroupInfo) {
  const roles = groupInfo.members.find((m) => m.userId === userId)?.roles ?? [];
  const roleNames = groupInfo.roles
    .filter((r) => roles.includes(r._id))
    .map((r) => r.name);

  return roleNames;
}
