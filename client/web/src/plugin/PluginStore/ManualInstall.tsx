import React, { useMemo, useState } from 'react';
import {
  isValidJson,
  localTrans,
  showToasts,
  t,
  useAsyncRequest,
} from 'tailchat-shared';
import {
  LoaderCircleIcon,
  PackagePlusIcon,
  ShieldAlertIcon,
} from 'lucide-react';
import { pluginManager } from '../manager';
import { parsePluginManifest } from '../utils';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/official/alert';
import { Button } from '@/components/ui/official/button';
import { Label } from '@/components/ui/official/label';
import { Textarea } from '@/components/ui/official/textarea';

/**
 * 手动安装
 */
export const ManualInstall: React.FC = React.memo(() => {
  const [json, setJson] = useState('');
  const [installError, setInstallError] = useState<unknown>();
  const hasJson = json.trim() !== '';
  const invalid = useMemo(() => !isValidJson(json), [json]);

  const [{ loading }, handleInstallPlugin] = useAsyncRequest(async () => {
    setInstallError(undefined);
    try {
      await pluginManager.installPlugin(parsePluginManifest(json));
      showToasts(t('安装成功'), 'success');
      setJson('');
    } catch (error) {
      setInstallError(error);
      throw error;
    }
  }, [json]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          {t('手动安装')}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {localTrans({
            'zh-CN':
              '粘贴完整的插件清单 JSON。仅在你信任来源并了解其权限时使用。',
            'en-US':
              'Paste a complete plugin manifest. Only continue when you trust the source and understand its permissions.',
          })}
        </p>
      </div>

      <Alert className="mb-5">
        <ShieldAlertIcon />
        <AlertTitle>
          {localTrans({
            'zh-CN': '插件可以访问你的 Tailchat 会话',
            'en-US': 'Plugins can access your Tailchat session',
          })}
        </AlertTitle>
        <AlertDescription>
          {t('请不要安装不明来源的插件，这可能会盗取你在 Tailchat 的个人信息')}
        </AlertDescription>
      </Alert>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid && !loading) {
            void handleInstallPlugin();
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="plugin-manifest">
            {localTrans({
              'zh-CN': '插件清单 JSON',
              'en-US': 'Plugin manifest JSON',
            })}
          </Label>
          <Textarea
            id="plugin-manifest"
            className="min-h-56 resize-y font-mono text-sm leading-6"
            placeholder={t(
              '请手动输入JSON信息，如果你不明确你在做什么请不要使用该功能'
            )}
            disabled={loading}
            value={json}
            aria-invalid={hasJson && invalid}
            aria-describedby="plugin-manifest-help plugin-manifest-error"
            onChange={(event) => setJson(event.target.value)}
            spellCheck={false}
          />
          <p
            id="plugin-manifest-help"
            className="text-xs text-muted-foreground"
          >
            {localTrans({
              'zh-CN': '清单必须是有效的 JSON，并包含插件名称和入口 URL。',
              'en-US':
                'The manifest must be valid JSON and include the plugin name and entry URL.',
            })}
          </p>
          <p
            id="plugin-manifest-error"
            className="min-h-5 text-sm text-destructive"
            role={hasJson && (invalid || installError) ? 'alert' : undefined}
          >
            {hasJson && invalid
              ? t('不是一个合法的JSON字符串')
              : installError
              ? localTrans({
                  'zh-CN': '安装失败。请检查清单内容后重试。',
                  'en-US':
                    'Installation failed. Check the manifest and try again.',
                })
              : null}
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="submit"
            size="lg"
            aria-busy={loading}
            disabled={invalid || loading}
          >
            {loading ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <PackagePlusIcon data-icon="inline-start" />
            )}
            {loading
              ? localTrans({ 'zh-CN': '正在安装', 'en-US': 'Installing' })
              : localTrans({
                  'zh-CN': '安装插件',
                  'en-US': 'Install plugin',
                })}
          </Button>
        </div>
      </form>
    </div>
  );
});
ManualInstall.displayName = 'ManualInstall';
