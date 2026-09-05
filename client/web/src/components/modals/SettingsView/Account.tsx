import { AvatarUploader } from '@/components/ImageUploader';
import {
  DefaultFullModalInputEditorRender,
  FullModalField,
} from '@/components/FullModal/Field';
import { openModal } from '@/components/Modal';
import { closeModal, pluginUserExtraInfo } from '@/plugin/common';
import { setUserJWT } from '@/utils/jwt-helper';
import React, { useCallback } from 'react';
import {
  model,
  modifyUserField,
  showSuccessToasts,
  showToasts,
  t,
  UploadFileResult,
  useAlphaMode,
  useAppDispatch,
  useAsyncRequest,
  userActions,
  useUserInfo,
} from 'tailchat-shared';
import { EmailVerify } from '../EmailVerify';
import { ModifyPassword } from '../ModifyPassword';
import { isBuiltinEmail } from '@/utils/user-helper';
import { Button } from '@/components/ui/official/button';
import { Badge } from '@/components/ui/official/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';
import {
  SettingsFieldGroup,
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from './Layout';
import { KeyRoundIcon, LogOutIcon } from 'lucide-react';

export const SettingsAccount: React.FC = React.memo(() => {
  const userInfo = useUserInfo();
  const dispatch = useAppDispatch();
  const { isAlphaMode } = useAlphaMode();
  const userExtra = userInfo?.extra ?? {};

  const [, handleUserAvatarChange] = useAsyncRequest(
    async (fileInfo: UploadFileResult) => {
      await modifyUserField('avatar', fileInfo.url);
      dispatch(
        userActions.setUserInfoField({
          fieldName: 'avatar',
          fieldValue: fileInfo.url,
        })
      );
      showToasts(t('修改头像成功'), 'success');
    },
    []
  );

  const [, handleUpdateNickName] = useAsyncRequest(
    async (newNickname: string) => {
      await modifyUserField('nickname', newNickname);
      dispatch(
        userActions.setUserInfoField({
          fieldName: 'nickname',
          fieldValue: newNickname,
        })
      );
      showToasts(t('修改昵称成功'), 'success');
    },
    []
  );

  const [, handleUpdateExtraInfo] = useAsyncRequest(
    async (fieldName: string, fieldValue: unknown) => {
      await model.user.modifyUserExtra(fieldName, fieldValue);
      dispatch(
        userActions.setUserInfoExtra({
          fieldName,
          fieldValue,
        })
      );
      showSuccessToasts(t('修改成功'));
    },
    []
  );

  const handleUpdatePassword = useCallback(() => {
    const key = openModal(<ModifyPassword onSuccess={() => closeModal(key)} />);
  }, []);

  // 登出
  const handleLogout = useCallback(async () => {
    await setUserJWT(null);

    window.location.replace('/'); // 重载页面以清空所有状态
  }, []);

  if (!userInfo) {
    return null;
  }

  return (
    <SettingsPage
      title={t('账户信息')}
      description={t('管理你的个人资料、登录凭据和账户会话。')}
    >
      <SettingsSection
        title={t('个人资料')}
        description={t('这些信息会展示给与你协作的其他成员。')}
      >
        <div className="flex min-w-0 flex-col gap-8 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <AvatarUploader
              circle={true}
              usage="user"
              onUploadSuccess={handleUserAvatarChange}
            >
              <Avatar className="size-28">
                <AvatarImage
                  src={userInfo.avatar || undefined}
                  alt={userInfo.nickname}
                />
                <AvatarFallback className="text-3xl font-semibold">
                  {userInfo.nickname?.slice(0, 1).toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
            </AvatarUploader>
            <p className="mt-2 max-w-28 text-center text-xs leading-5 text-muted-foreground">
              {t('点击头像上传新图片')}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            {isAlphaMode && (
              <FullModalField title={t('用户ID')} content={userInfo._id} />
            )}
            <FullModalField
              title={t('用户昵称')}
              value={userInfo.nickname}
              editable={true}
              renderEditor={DefaultFullModalInputEditorRender}
              onSave={handleUpdateNickName}
            />

            <FullModalField
              title={t('邮箱')}
              content={
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="min-w-0 break-all">{userInfo.email}</span>
                  {isBuiltinEmail(userInfo.email) ? (
                    <Badge variant="secondary" className="select-none">
                      {t('内置邮箱')}
                    </Badge>
                  ) : userInfo.emailVerified ? (
                    <Badge
                      variant="secondary"
                      className="select-none bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    >
                      {t('已认证')}
                    </Badge>
                  ) : (
                    <Badge
                      render={<button type="button" />}
                      variant="secondary"
                      className="cursor-pointer bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300"
                      onClick={() => {
                        if (userInfo.temporary) {
                          showToasts(
                            t('临时用户无法认证邮箱, 请先认领账号'),
                            'warning'
                          );
                          return;
                        }

                        const key = openModal(
                          <EmailVerify
                            onSuccess={() => {
                              closeModal(key);
                            }}
                          />
                        );
                      }}
                    >
                      {t('未认证')}
                    </Badge>
                  )}
                </div>
              }
            />

            {pluginUserExtraInfo.map((item, i) => {
              if (item.component && item.component.editor) {
                const Component = item.component.editor;
                return (
                  <Component
                    key={item.name + i}
                    value={userExtra[item.name]}
                    onSave={(val) => handleUpdateExtraInfo(item.name, val)}
                  />
                );
              }

              return (
                <FullModalField
                  key={item.name + i}
                  title={item.label}
                  value={
                    userExtra[item.name] ? String(userExtra[item.name]) : ''
                  }
                  editable={true}
                  renderEditor={DefaultFullModalInputEditorRender}
                  onSave={(val) => handleUpdateExtraInfo(item.name, val)}
                />
              );
            })}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t('安全')}
        description={t('更新密码以保护你的账户。')}
      >
        <SettingsFieldGroup>
          <SettingsRow
            title={t('密码')}
            description={t('使用强密码并定期更新。')}
          >
            <Button variant="outline" onClick={handleUpdatePassword}>
              <KeyRoundIcon />
              {t('修改密码')}
            </Button>
          </SettingsRow>
        </SettingsFieldGroup>
      </SettingsSection>

      <SettingsSection
        title={t('账户会话')}
        description={t('退出当前设备上的 Anchor Chat 会话。')}
      >
        <SettingsFieldGroup>
          <SettingsRow
            title={t('退出登录')}
            description={t('你需要重新输入凭据才能再次访问此账户。')}
          >
            <Button variant="destructive" onClick={handleLogout}>
              <LogOutIcon />
              {t('退出登录')}
            </Button>
          </SettingsRow>
        </SettingsFieldGroup>
      </SettingsSection>
    </SettingsPage>
  );
});
SettingsAccount.displayName = 'SettingsAccount';
