import { FullModalFactory } from '@/components/FullModal/Factory';
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
import { Button } from '@/components/ui/official/button';
import { Switch } from '@/components/ui/official/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/official/select';
import {
  SettingsFieldGroup,
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from './Layout';
import { RotateCwIcon } from 'lucide-react';

export const SettingsSystem: React.FC = React.memo(() => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { settings, setSettings, loading } = useUserSettings();
  const { isAlphaMode, setAlphaMode } = useAlphaMode();
  const { density, setDensity } = useMessageDensity();
  const colorSchemeOptions = [
    { value: 'dark', label: t('暗黑模式') },
    { value: 'light', label: t('亮色模式') },
    { value: 'auto', label: t('自动') },
    ...pluginColorScheme.map((scheme) => ({
      value: scheme.name,
      label: scheme.label,
    })),
  ];
  const densityOptions = [
    { value: 'comfortable', label: t('舒适') },
    { value: 'compact', label: t('紧凑') },
  ];

  return (
    <SettingsPage
      title={t('系统设置')}
      description={t('调整 Tailchat 的外观、消息体验和实验性功能。')}
    >
      <SettingsSection
        title={t('外观')}
        description={t('选择界面语言、配色方案和消息显示密度。')}
      >
        <SettingsFieldGroup>
          <SettingsRow title={t('系统语言')}>
            <LanguageSelect />
          </SettingsRow>
          <SettingsRow title={t('配色方案')}>
            <Select
              value={colorScheme}
              onValueChange={(value) => value !== null && setColorScheme(value)}
              items={colorSchemeOptions}
            >
              <SelectTrigger
                aria-label={t('配色方案')}
                className="w-full sm:w-[280px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorSchemeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
          <SettingsRow title={t('消息密度')}>
            <Select
              value={density}
              onValueChange={(value) => value !== null && setDensity(value)}
              items={densityOptions}
            >
              <SelectTrigger
                aria-label={t('消息密度')}
                className="w-full sm:w-[280px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {densityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsFieldGroup>
      </SettingsSection>

      <SettingsSection
        title={t('消息体验')}
        description={t('控制会话列表和消息操作的行为。')}
      >
        <SettingsFieldGroup>
          <SettingsRow
            title={t('关闭消息右键菜单')}
            description={t('停用消息上的自定义上下文菜单。')}
          >
            <Switch
              aria-label={t('关闭消息右键菜单')}
              checked={settings['disableMessageContextMenu'] ?? false}
              onCheckedChange={(checked) =>
                setSettings({
                  disableMessageContextMenu: checked,
                })
              }
            />
          </SettingsRow>

          {isAlphaMode && (
            <SettingsRow
              title={t('聊天列表虚拟化') + ' (Beta)'}
              description={t('减少大型会话中的渲染开销。')}
            >
              <Switch
                aria-label={t('聊天列表虚拟化')}
                disabled={loading}
                checked={settings.messageListVirtualization ?? false}
                onCheckedChange={(checked) =>
                  setSettings({
                    messageListVirtualization: checked,
                  })
                }
              />
            </SettingsRow>
          )}
        </SettingsFieldGroup>
      </SettingsSection>

      {pluginSettings.some((item) => item.position === 'system') && (
        <SettingsSection
          title={t('插件设置')}
          description={t('由已安装插件提供的附加配置。')}
        >
          <div className="max-w-xl">
            {pluginSettings
              .filter((item) => item.position === 'system')
              .map((item) => (
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
              ))}
          </div>
        </SettingsSection>
      )}

      <SettingsSection
        title={t('实验性功能')}
        description={t('提前体验仍在测试中的功能。')}
      >
        <SettingsFieldGroup>
          <SettingsRow
            title={t('Alpha测试开关')}
            description={t(
              '在 Alpha 模式下会有一些尚处于测试阶段的功能将会被开放，如果出现问题欢迎反馈'
            )}
          >
            <Switch
              aria-label={t('Alpha测试开关')}
              checked={isAlphaMode ?? false}
              onCheckedChange={(checked) => setAlphaMode(checked)}
            />
          </SettingsRow>
        </SettingsFieldGroup>
      </SettingsSection>

      <SettingsSection
        title={t('应用更改')}
        description={t('重新加载 Tailchat 以确保所有设置完全生效。')}
      >
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RotateCwIcon />
          {t('重新加载')}
        </Button>
      </SettingsSection>
    </SettingsPage>
  );
});
SettingsSystem.displayName = 'SettingsSystem';
