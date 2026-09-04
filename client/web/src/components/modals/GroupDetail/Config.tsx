import React from 'react';
import {
  groupActions,
  model,
  showSuccessToasts,
  t,
  UploadFileResult,
  useAppDispatch,
  useAsyncRequest,
  useGroupInfo,
} from 'tailchat-shared';
import { Loading } from '@/components/Loading';
import { pluginGroupConfigItems } from '@/plugin/common';
import { ensurePluginNamePrefix } from '@/utils/plugin-helper';
import { ImageUploader } from '@/components/ImageUploader';
import { Button } from '@/components/ui/official/button';
import { Switch } from '@/components/ui/official/switch';
import { ImageIcon, Trash2Icon } from 'lucide-react';
import {
  GroupDetailFieldGroup,
  GroupDetailPage,
  GroupDetailRow,
  GroupDetailSection,
} from './Layout';

export const GroupConfig: React.FC<{
  groupId: string;
}> = React.memo((props) => {
  const groupId = props.groupId;
  const groupInfo = useGroupInfo(groupId);
  const dispatch = useAppDispatch();

  const [{ loading }, handleModifyConfig] = useAsyncRequest(
    async (configName: model.group.GroupConfigNames, configValue: any) => {
      await model.group.modifyGroupConfig(groupId, configName, configValue);
      dispatch(
        groupActions.updateGroupConfig({
          groupId,
          configName,
          configValue,
        })
      );
      showSuccessToasts();
    },
    [groupId]
  );

  if (!groupInfo) {
    return <Loading spinning={true} />;
  }

  const config = groupInfo.config ?? {};

  return (
    <GroupDetailPage
      title={t('群组配置')}
      description={t('控制成员隐私、群组外观和插件提供的设置。')}
    >
      <GroupDetailSection
        title={t('成员隐私')}
        description={t('限制成员信息的可见范围和群组内私信行为。')}
      >
        <GroupDetailFieldGroup>
          <GroupDetailRow
            title={t('隐藏成员完整名称')}
            description={t('群组隐私控制，防止通过群组恶意获取成员信息')}
          >
            <Switch
              aria-label={t('隐藏成员完整名称')}
              disabled={loading}
              checked={config['hideGroupMemberDiscriminator'] ?? false}
              onCheckedChange={(checked) =>
                handleModifyConfig('hideGroupMemberDiscriminator', checked)
              }
            />
          </GroupDetailRow>

          {/* 如果开启了 hideGroupMemberDiscriminator 则视为禁止发起私信 */}
          <GroupDetailRow
            title={t('禁止在群组发起私信')}
            description={t('群组隐私控制，防止通过群组恶意骚扰用户。')}
          >
            <Switch
              aria-label={t('禁止在群组发起私信')}
              disabled={
                loading || config['hideGroupMemberDiscriminator'] === true
              }
              checked={
                (config['hideGroupMemberDiscriminator'] === true ||
                  config['disableCreateConverseFromGroup']) ??
                false
              }
              onCheckedChange={(checked) =>
                handleModifyConfig('disableCreateConverseFromGroup', checked)
              }
            />
          </GroupDetailRow>
        </GroupDetailFieldGroup>
      </GroupDetailSection>

      <GroupDetailSection
        title={t('群组背景')}
        description={t('个性化配置群组背景，将会在群组邀请页面展示')}
      >
        <div className="max-w-2xl space-y-3">
          <ImageUploader
            className="block w-full rounded-xl focus-within:ring-2 focus-within:ring-ring"
            aspect={16 / 9}
            usage="group"
            onUploadSuccess={(fileInfo: UploadFileResult) => {
              handleModifyConfig('groupBackgroundImage', fileInfo.url);
            }}
          >
            <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
              {config['groupBackgroundImage'] ? (
                <img
                  className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                  src={config['groupBackgroundImage']}
                  alt={t('群组背景')}
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="size-8" />
                  <span className="text-sm">{t('点击上传群组背景')}</span>
                </div>
              )}
            </div>
          </ImageUploader>
          <p className="text-xs text-muted-foreground">
            {t('建议比例: 16:9 | 建议大小: 1280x720')}
          </p>

          {config['groupBackgroundImage'] && (
            <Button
              variant="destructive"
              onClick={() => {
                handleModifyConfig('groupBackgroundImage', '');
              }}
            >
              <Trash2Icon />
              {t('清除')}
            </Button>
          )}
        </div>
      </GroupDetailSection>

      {pluginGroupConfigItems.length > 0 && (
        <GroupDetailSection
          title={t('插件设置')}
          description={t('由已安装插件提供的群组配置。')}
        >
          <GroupDetailFieldGroup>
            {pluginGroupConfigItems.map((item) => {
              const name = ensurePluginNamePrefix(item.name);
              return (
                <GroupDetailRow
                  key={name}
                  title={item.title}
                  description={item.tip}
                >
                  {React.createElement(item.component, {
                    value: config[name],
                    onChange: (val: any) => handleModifyConfig(name, val),
                    loading,
                    groupId,
                  })}
                </GroupDetailRow>
              );
            })}
          </GroupDetailFieldGroup>
        </GroupDetailSection>
      )}
    </GroupDetailPage>
  );
});
GroupConfig.displayName = 'GroupConfig';
