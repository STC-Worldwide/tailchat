import { FullModalFactory } from '@/components/FullModal/Factory';
import { FullModalField } from '@/components/FullModal/Field';
import { LanguageSelect } from '@/components/LanguageSelect';
import { pluginColorScheme, pluginSettings } from '@/plugin/common';
import React from 'react';
import {
  t,
  useAlphaMode,
  useColorScheme,
  useUserSettings,
} from 'tailchat-shared';
import _get from 'lodash/get';
import { useMessageDensity } from '@/hooks/useMessageDensity';
import { TcSelect } from '@/components/ui/select';
import { TcSwitch } from '@/components/ui/switch';
import { TcButton } from '@/components/ui/button';

export const SettingsSystem: React.FC = React.memo(() => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { settings, setSettings, loading } = useUserSettings();
  const { isAlphaMode, setAlphaMode } = useAlphaMode();
  const { density, setDensity } = useMessageDensity();

  return (
    <div>
      <FullModalField title={t('系统语言')} content={<LanguageSelect />} />

      <FullModalField
        title={t('配色方案')}
        content={
          <TcSelect
            triggerClassName="w-[280px]"
            value={colorScheme}
            onChange={setColorScheme}
            options={[
              { value: 'dark', label: t('暗黑模式') },
              { value: 'light', label: t('亮色模式') },
              { value: 'auto', label: t('自动') },
              ...pluginColorScheme.map((pcs) => ({
                value: pcs.name,
                label: pcs.label,
              })),
            ]}
          />
        }
      />

      <FullModalField
        title={t('消息密度')}
        content={
          <TcSelect
            triggerClassName="w-[280px]"
            value={density}
            onChange={setDensity}
            options={[
              { value: 'comfortable', label: t('舒适') },
              { value: 'compact', label: t('紧凑') },
            ]}
          />
        }
      />

      <FullModalField
        title={t('关闭消息右键菜单')}
        content={
          <TcSwitch
            checked={settings['disableMessageContextMenu'] ?? false}
            onChange={(checked) =>
              setSettings({
                disableMessageContextMenu: checked,
              })
            }
          />
        }
      />

      {pluginSettings
        .filter((item) => item.position === 'system')
        .map((item) => {
          return (
            <FullModalFactory
              key={item.name}
              value={_get(settings, item.name, item.defaultValue ?? false)}
              onChange={(val) => {
                setSettings({
                  [item.name]: val,
                });
              }}
              config={item}
            />
          );
        })}

      <FullModalField
        title={t('Alpha测试开关')}
        tip={t(
          '在 Alpha 模式下会有一些尚处于测试阶段的功能将会被开放，如果出现问题欢迎反馈'
        )}
        content={
          <TcSwitch
            checked={isAlphaMode ?? false}
            onChange={(checked) => setAlphaMode(checked)}
          />
        }
      />

      {isAlphaMode && (
        <FullModalField
          title={t('聊天列表虚拟化') + ' (Beta)'}
          content={
            <TcSwitch
              disabled={loading}
              checked={settings.messageListVirtualization ?? false}
              onChange={(checked) =>
                setSettings({
                  messageListVirtualization: checked,
                })
              }
            />
          }
        />
      )}
      <TcButton variant="primary" onClick={() => window.location.reload()}>
        {t('重新加载')}
      </TcButton>
    </div>
  );
});
SettingsSystem.displayName = 'SettingsSystem';
