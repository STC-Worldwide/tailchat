import React, { useCallback, useState } from 'react';
import {
  isValidStr,
  localTrans,
  parseUrlStr,
  type PluginManifest,
  showAlert,
  showToasts,
  t,
  useAsyncRequest,
} from 'tailchat-shared';
import {
  BookOpenIcon,
  LoaderCircleIcon,
  PackageCheckIcon,
  PackageMinusIcon,
  PackagePlusIcon,
} from 'lucide-react';
import { ModalWrapper, openModal } from '../common';
import { pluginManager } from '../manager';
import { DocumentView } from './DocumentView';
import { getManifestFieldWithI18N } from '../utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';
import { Badge } from '@/components/ui/official/badge';
import { Button } from '@/components/ui/official/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/official/card';

/**
 * 插件项
 */
export const PluginStoreItem: React.FC<{
  manifest: PluginManifest;
  installed: boolean;
  builtin?: boolean;
}> = React.memo((props) => {
  const { manifest, builtin = false } = props;
  const [installed, setInstalled] = useState(props.installed);

  const [{ loading }, handleInstallPlugin] = useAsyncRequest(async () => {
    await pluginManager.installPlugin(manifest);
    if (manifest.requireRestart === true) {
      showToasts(t('插件安装成功, 刷新页面后生效'), 'success');
    } else {
      showToasts(t('插件安装成功'), 'success');
    }
    setInstalled(true);
  }, [manifest]);

  const handleUninstallPlugin = useCallback(() => {
    showAlert({
      message: t('是否要卸载插件'),
      onConfirm: async () => {
        await pluginManager.uninstallPlugin(manifest.name);
        setInstalled(false);
        showToasts(t('插件卸载成功, 刷新页面后生效'), 'success');
      },
    });
  }, [manifest]);

  const label = getManifestFieldWithI18N(manifest, 'label');
  const description = getManifestFieldWithI18N(manifest, 'description');
  const titleId = `plugin-${manifest.name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const hasDocument = isValidStr(manifest.documentUrl);

  const handleShowDocument = useCallback(() => {
    if (!isValidStr(manifest.documentUrl)) {
      return;
    }

    openModal(
      <ModalWrapper title={label}>
        <DocumentView documentUrl={parseUrlStr(manifest.documentUrl)} />
      </ModalWrapper>
    );
  }, [label, manifest.documentUrl]);

  return (
    <Card
      size="sm"
      className="h-full bg-card/75 transition-colors hover:bg-card"
      role="article"
      aria-labelledby={titleId}
    >
      <CardHeader className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <Avatar
          className="row-span-3 size-11 rounded-lg after:rounded-lg"
          aria-hidden="true"
        >
          <AvatarImage
            src={manifest.icon || undefined}
            alt=""
            className="rounded-lg"
          />
          <AvatarFallback className="rounded-lg bg-primary/10 font-semibold text-primary">
            {label.slice(0, 1).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 items-start justify-between gap-2">
          <CardTitle id={titleId} className="line-clamp-2 min-w-0">
            {label}
          </CardTitle>
          {builtin && (
            <Badge variant="secondary" className="shrink-0">
              <PackageCheckIcon data-icon="inline-start" />
              {localTrans({ 'zh-CN': '内置', 'en-US': 'Built in' })}
            </Badge>
          )}
        </div>
        <code className="block truncate rounded-none border-0! bg-transparent! p-0! text-xs text-muted-foreground ring-0! shadow-none!">
          {manifest.name}
        </code>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm leading-5 text-muted-foreground">
          {description ||
            localTrans({
              'zh-CN': '该插件没有提供描述。',
              'en-US': 'No description was provided for this plugin.',
            })}
        </p>
      </CardContent>

      {(hasDocument || !builtin) && (
        <CardFooter className="min-h-14 justify-end gap-2 border-border/70 px-3 py-2.5">
          {hasDocument && (
            <Button variant="ghost" size="sm" onClick={handleShowDocument}>
              <BookOpenIcon data-icon="inline-start" />
              {t('文档')}
            </Button>
          )}

          {!builtin &&
            (installed ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUninstallPlugin}
              >
                <PackageMinusIcon data-icon="inline-start" />
                {localTrans({ 'zh-CN': '卸载', 'en-US': 'Uninstall' })}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={loading}
                aria-busy={loading}
                onClick={handleInstallPlugin}
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
                  ? localTrans({
                      'zh-CN': '正在安装',
                      'en-US': 'Installing',
                    })
                  : t('安装')}
              </Button>
            ))}
        </CardFooter>
      )}
    </Card>
  );
});
PluginStoreItem.displayName = 'PluginStoreItem';
