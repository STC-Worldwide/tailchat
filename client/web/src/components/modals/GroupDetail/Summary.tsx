import { AvatarUploader } from '@/components/ImageUploader';
import {
  DefaultFullModalInputEditorRender,
  FullModalField,
  FullModalFieldEditorRenderComponent,
} from '@/components/FullModal/Field';
import { NoData } from '@/components/NoData';
import React from 'react';
import {
  modifyGroupField,
  PERMISSION,
  showSuccessToasts,
  showToasts,
  t,
  UploadFileResult,
  useAsyncRequest,
  useGroupInfo,
  useHasGroupPermission,
} from 'tailchat-shared';
import { Textarea } from '@/components/ui/official/textarea';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';
import {
  GroupDetailFieldGroup,
  GroupDetailPage,
  GroupDetailSection,
} from './Layout';

export const GroupSummary: React.FC<{
  groupId: string;
}> = React.memo(({ groupId }) => {
  const groupInfo = useGroupInfo(groupId);
  const [hasBaseInfoPermission] = useHasGroupPermission(groupId, [
    PERMISSION.core.groupBaseInfo,
  ]);

  const [, handleUpdateGroupName] = useAsyncRequest(
    async (newName: string) => {
      await modifyGroupField(groupId, 'name', newName);
      showSuccessToasts(t('修改群组名成功'));
    },
    [groupId]
  );

  const [, handleUpdateGroupDescription] = useAsyncRequest(
    async (newName: string) => {
      await modifyGroupField(groupId, 'description', newName);
      showSuccessToasts(t('修改群组描述成功'));
    },
    [groupId]
  );

  const [, handleGroupAvatarChange] = useAsyncRequest(
    async (fileInfo: UploadFileResult) => {
      await modifyGroupField(groupId, 'avatar', fileInfo.url);
      showToasts(t('修改群组头像成功'), 'success');
    },
    [groupId]
  );

  if (!groupInfo) {
    return <NoData message={t('无法获取到群组信息')} />;
  }

  return (
    <GroupDetailPage
      title={t('群组概述')}
      description={t('管理群组的公开资料和基本信息。')}
    >
      <GroupDetailSection
        title={t('群组资料')}
        description={t('这些信息会展示在群组、邀请页面和成员列表中。')}
      >
        <div className="grid gap-8 md:grid-cols-[9rem_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3">
            <AvatarUploader
              circle={true}
              usage="group"
              onUploadSuccess={handleGroupAvatarChange}
            >
              <Avatar className="size-28 border border-border shadow-sm">
                <AvatarImage src={groupInfo.avatar} alt={groupInfo.name} />
                <AvatarFallback className="text-3xl font-semibold">
                  {groupInfo.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </AvatarUploader>
            <p className="text-center text-xs leading-5 text-muted-foreground">
              {t('点击头像上传新的群组图片')}
            </p>
          </div>

          <GroupDetailFieldGroup className="[&>[data-slot=field]]:mb-0 [&>[data-slot=field]]:px-4 [&>[data-slot=field]]:py-3.5">
            <FullModalField
              title={t('群组名称')}
              value={groupInfo.name}
              editable={hasBaseInfoPermission}
              renderEditor={DefaultFullModalInputEditorRender}
              onSave={handleUpdateGroupName}
            />

            <FullModalField
              title={t('成员数')}
              value={String(groupInfo.members.length)}
            />

            <FullModalField
              title={t('群组描述')}
              value={groupInfo.description ?? ''}
              content={
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {groupInfo.description || t('暂无群组描述')}
                </p>
              }
              editable={hasBaseInfoPermission}
              renderEditor={GroupDescriptionEditorRender}
              onSave={handleUpdateGroupDescription}
            />
          </GroupDetailFieldGroup>
        </div>
      </GroupDetailSection>
    </GroupDetailPage>
  );
});
GroupSummary.displayName = 'GroupSummary';

const GroupDescriptionEditorRender: FullModalFieldEditorRenderComponent = ({
  value,
  onChange,
}) => (
  <Textarea
    rows={5}
    maxLength={120}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);
