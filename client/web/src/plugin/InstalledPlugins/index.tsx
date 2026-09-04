/**
 * Installed plugins — a read-only list.
 *
 * This used to be a plugin store: a catalogue, install and uninstall buttons,
 * and a tab that took a pasted manifest pointing anywhere. All of that decided
 * things per browser, which is the wrong shape for an app whose users are
 * clients of one server — an install nobody else had produced panels that
 * rendered for exactly one person.
 *
 * What loads is now the server's decision, so this page only reports it.
 */

import React from 'react';
import { localTrans, PluginManifest, useAsync } from 'tailchat-shared';
import { AlertCircleIcon, BoxesIcon } from 'lucide-react';
import { builtinPlugins } from '../builtin';
import { pluginManager } from '../manager';
import { InstalledPluginItem } from './Item';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/official/alert';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';
import { Skeleton } from '@/components/ui/official/skeleton';

const pluginGridClassName =
  'grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-3';

export const InstalledPlugins: React.FC = React.memo(() => {
  const { loading, error, value } = useAsync(
    async () => pluginManager.getInstalledPlugins(),
    []
  );

  const plugins: PluginManifest[] = value ?? [];
  const builtinNames = builtinPlugins.map((plugin) => plugin.name);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5">
          <h1 className="text-lg font-semibold text-foreground">
            {localTrans({
              'zh-CN': '已安装插件',
              'en-US': 'Installed plugins',
            })}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {localTrans({
              'zh-CN': '这些插件由服务器统一安装, 所有成员看到的功能一致。',
              'en-US':
                'These are installed by the server, so every member has the same features. Ask an administrator to add or remove one.',
            })}
          </p>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircleIcon />
            <AlertTitle>
              {localTrans({
                'zh-CN': '无法获取插件列表',
                'en-US': 'Could not load the plugin list',
              })}
            </AlertTitle>
            <AlertDescription>{String(error)}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className={pluginGridClassName}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : plugins.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BoxesIcon />
              </EmptyMedia>
              <EmptyTitle>
                {localTrans({
                  'zh-CN': '没有已安装的插件',
                  'en-US': 'No plugins are installed',
                })}
              </EmptyTitle>
              <EmptyDescription>
                {localTrans({
                  'zh-CN': '服务器尚未安装任何插件。',
                  'en-US': 'This server has not installed any plugins yet.',
                })}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className={pluginGridClassName}>
            {plugins.map((manifest) => (
              <InstalledPluginItem
                key={manifest.name}
                manifest={manifest}
                builtin={builtinNames.includes(manifest.name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
InstalledPlugins.displayName = 'InstalledPlugins';
