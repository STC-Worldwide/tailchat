import { pluginInspectServices } from '@/plugin/common';
import React, { useMemo } from 'react';
import { t, useAvailableServices } from 'tailchat-shared';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/ui/official/button';
import { Badge } from '@/components/ui/official/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/official/table';
import { SettingsPage, SettingsSection } from './Layout';
import { RefreshCwIcon } from 'lucide-react';

/**
 * 默认检查服务列表
 */
const DEFAULT_SERVICES = [
  {
    name: 'config',
    label: t('全局配置'),
  },
  {
    name: 'gateway',
    label: t('服务网关'),
  },
  {
    name: 'user',
    label: t('用户服务'),
  },
  {
    name: 'user.dmlist',
    label: t('私信服务'),
  },
  {
    name: 'chat.message',
    label: t('聊天服务'),
  },
  {
    name: 'chat.converse',
    label: t('会话服务'),
  },
  {
    name: 'chat.ack',
    label: t('已读服务'),
  },
  {
    name: 'friend',
    label: t('好友服务'),
  },
  {
    name: 'group',
    label: t('群组服务'),
  },
  {
    name: 'group.invite',
    label: t('群组邀请服务'),
  },
  {
    name: 'file',
    label: t('文件服务'),
  },
  {
    name: 'mail',
    label: t('邮件服务'),
  },
  {
    name: 'plugin.registry',
    label: t('插件中心服务'),
  },
];

/**
 * 服务状态
 */
export const SettingsStatus: React.FC = React.memo(() => {
  const inspectServices = useMemo(
    () => [...DEFAULT_SERVICES, ...pluginInspectServices],
    []
  ); // 需要检查服务状态的列表

  const { loading, availableServices, refetch } = useAvailableServices();

  return (
    <SettingsPage
      title={t('服务状态')}
      description={t('检查当前 Anchor Chat 部署中各项后端服务的可用性。')}
    >
      <SettingsSection
        title={t('服务检查')}
        description={t('状态来自当前连接的服务网关。')}
        action={
          <Button
            variant="outline"
            disabled={loading}
            aria-busy={loading}
            onClick={refetch}
          >
            <RefreshCwIcon className={loading ? 'animate-spin' : undefined} />
            {t('刷新')}
          </Button>
        }
      >
        <div className="overflow-hidden rounded-lg border border-border">
          <Loading spinning={loading}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('服务')}</TableHead>
                  <TableHead className="w-36">{t('状态')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspectServices.map((service) => {
                  const available = availableServices?.includes(service.name);
                  return (
                    <TableRow key={service.name}>
                      <TableCell className="font-medium">
                        {service.label}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={available ? 'secondary' : 'destructive'}
                          className={
                            available
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : undefined
                          }
                        >
                          <span
                            className={
                              available
                                ? 'size-1.5 rounded-full bg-emerald-500'
                                : 'size-1.5 rounded-full bg-destructive'
                            }
                          />
                          {available ? t('当前服务可用') : t('服务异常')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Loading>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
});
SettingsStatus.displayName = 'SettingsStatus';
