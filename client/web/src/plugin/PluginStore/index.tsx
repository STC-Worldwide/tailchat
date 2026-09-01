/**
 * 插件商店
 */

import React from 'react';
import _uniqBy from 'lodash/uniqBy';
import { localTrans, PluginManifest, t, useAsync } from 'tailchat-shared';
import {
  AlertCircleIcon,
  BoxesIcon,
  PackageCheckIcon,
  WrenchIcon,
} from 'lucide-react';
import { builtinPlugins } from '../builtin';
import { pluginManager } from '../manager';
import { PluginStoreItem } from './Item';
import { ManualInstall } from './ManualInstall';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/official/alert';
import { Badge } from '@/components/ui/official/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/official/empty';
import { Skeleton } from '@/components/ui/official/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/official/tabs';

function usePluginStoreData() {
  const installed = useAsync(
    async () => pluginManager.getInstalledPlugins(),
    []
  );
  const registry = useAsync(async () => pluginManager.getRegistryPlugins(), []);

  return {
    loading: installed.loading || registry.loading,
    error: installed.error || registry.error,
    installedPluginList: installed.value ?? [],
    allPlugins: registry.value ?? [],
  };
}

const pluginGridClassName =
  'grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-3';

interface PluginSectionProps {
  sectionId: string;
  title: string;
  description: string;
  plugins: PluginManifest[];
  installedPluginNames: string[];
  builtinPluginNames: string[];
  emptyTitle?: string;
}

const PluginSection: React.FC<PluginSectionProps> = React.memo((props) => {
  const {
    sectionId,
    title,
    description,
    plugins,
    installedPluginNames,
    builtinPluginNames,
    emptyTitle = localTrans({
      'zh-CN': '暂无插件',
      'en-US': 'No plugins available',
    }),
  } = props;

  return (
    <section aria-labelledby={`plugin-section-${sectionId}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id={`plugin-section-${sectionId}`}
            className="text-base font-semibold text-foreground"
          >
            {title}
          </h2>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {plugins.length}
        </Badge>
      </div>

      {plugins.length > 0 ? (
        <div className={pluginGridClassName}>
          {plugins.map((plugin) => (
            <PluginStoreItem
              key={plugin.name}
              manifest={plugin}
              installed={installedPluginNames.includes(plugin.name)}
              builtin={builtinPluginNames.includes(plugin.name)}
            />
          ))}
        </div>
      ) : (
        <Empty className="min-h-52 border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BoxesIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>
              {localTrans({
                'zh-CN': '当前来源没有可显示的插件。',
                'en-US': 'There are no plugins to show from this source.',
              })}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
});
PluginSection.displayName = 'PluginSection';

const PluginStoreLoading: React.FC = React.memo(() => (
  <div className="h-full min-h-0 bg-background text-foreground" role="status">
    <div className="flex h-14 items-center gap-4 border-b px-4">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-8 w-72 max-w-[55vw]" />
    </div>
    <div className="p-4">
      <Skeleton className="mb-2 h-5 w-36" />
      <Skeleton className="mb-4 h-4 w-80 max-w-full" />
      <div className={pluginGridClassName}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
    <span className="sr-only">{t('正在加载插件列表')}</span>
  </div>
));
PluginStoreLoading.displayName = 'PluginStoreLoading';

export const PluginStore: React.FC = React.memo(() => {
  const { loading, error, installedPluginList, allPlugins } =
    usePluginStoreData();

  if (loading) {
    return <PluginStoreLoading />;
  }

  if (error) {
    return (
      <div className="flex h-full items-start justify-center bg-background p-4 pt-10">
        <Alert variant="destructive" className="max-w-xl">
          <AlertCircleIcon />
          <AlertTitle>
            {localTrans({
              'zh-CN': '无法加载插件',
              'en-US': 'Unable to load plugins',
            })}
          </AlertTitle>
          <AlertDescription>
            {localTrans({
              'zh-CN': '请检查网络连接，然后重新打开插件中心。',
              'en-US': 'Check your connection, then reopen the Plugin Store.',
            })}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const installedPlugins = _uniqBy(
    [...builtinPlugins, ...installedPluginList],
    'name'
  );
  const installedPluginNames = installedPlugins.map((plugin) => plugin.name);
  const builtinPluginNames = builtinPlugins.map((plugin) => plugin.name);
  const communityPlugins = allPlugins.filter(
    (plugin) => !builtinPluginNames.includes(plugin.name)
  );

  return (
    <Tabs
      defaultValue="installed"
      className="h-full min-h-0 w-full gap-0 bg-background text-foreground"
    >
      <header className="flex h-14 shrink-0 items-center border-b bg-background/95 px-2 supports-backdrop-filter:backdrop-blur-sm md:px-4">
        <h1 className="mr-4 hidden shrink-0 text-base font-semibold md:block">
          {t('插件中心')}
        </h1>
        <TabsList
          variant="line"
          aria-label={t('插件中心')}
          className="h-14 min-w-0 flex-1 justify-start overflow-x-auto overflow-y-hidden rounded-none bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <TabsTrigger
            value="installed"
            aria-label={t('已安装')}
            className="h-14 flex-none gap-1.5 px-2 md:gap-2 md:px-3"
          >
            <PackageCheckIcon />
            <span>{t('已安装')}</span>
            <Badge
              variant="secondary"
              className="h-5 min-w-5 px-1.5 tabular-nums"
            >
              {installedPlugins.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="all"
            aria-label={t('全部')}
            className="h-14 flex-none gap-1.5 px-2 md:gap-2 md:px-3"
          >
            <BoxesIcon />
            {t('全部')}
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            aria-label={t('手动安装')}
            className="h-14 flex-none gap-1.5 px-2 md:gap-2 md:px-3"
          >
            <WrenchIcon />
            <span className="md:hidden">
              {localTrans({ 'zh-CN': '手动', 'en-US': 'Manual' })}
            </span>
            <span className="hidden md:inline">{t('手动安装')}</span>
          </TabsTrigger>
        </TabsList>
      </header>

      <TabsContent
        value="installed"
        className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5"
      >
        <PluginSection
          sectionId="installed"
          title={t('已安装')}
          description={localTrans({
            'zh-CN': '当前可用的内置插件和已安装扩展。',
            'en-US':
              'Built-in features and extensions currently available to you.',
          })}
          plugins={installedPlugins}
          installedPluginNames={installedPluginNames}
          builtinPluginNames={builtinPluginNames}
          emptyTitle={localTrans({
            'zh-CN': '尚未安装插件',
            'en-US': 'No plugins installed yet',
          })}
        />
      </TabsContent>

      <TabsContent
        value="all"
        className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5"
      >
        <div className="space-y-8">
          <PluginSection
            sectionId="builtin"
            title={t('内置插件')}
            description={localTrans({
              'zh-CN': '随 Tailchat 一起提供并由当前部署管理的功能。',
              'en-US':
                'Features shipped with Tailchat and managed by this deployment.',
            })}
            plugins={builtinPlugins}
            installedPluginNames={installedPluginNames}
            builtinPluginNames={builtinPluginNames}
          />
          <PluginSection
            sectionId="registry"
            title={t('插件中心')}
            description={localTrans({
              'zh-CN': '浏览可从当前插件源安装的扩展。',
              'en-US':
                'Browse extensions available from the configured plugin registry.',
            })}
            plugins={communityPlugins}
            installedPluginNames={installedPluginNames}
            builtinPluginNames={builtinPluginNames}
          />
        </div>
      </TabsContent>

      <TabsContent
        value="manual"
        className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5"
      >
        <ManualInstall />
      </TabsContent>
    </Tabs>
  );
});
PluginStore.displayName = 'PluginStore';
