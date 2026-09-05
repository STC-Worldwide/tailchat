import React, { useEffect, useState } from 'react';
import { useSocketContext } from '@/context/SocketContext';
import { Button } from '@/components/ui/official/button';
import { Badge } from '@/components/ui/official/badge';
import {
  SettingsFieldGroup,
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from './Layout';
import { RefreshCwIcon } from 'lucide-react';
import { t } from 'tailchat-shared';

export const SettingsDebug: React.FC = React.memo(() => {
  const socket = useSocketContext();
  const [socketConnected, setSocketConnected] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setSocketConnected(socket.connected);
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, [socket]);

  return (
    <SettingsPage
      title={t('调试')}
      description={t('查看并测试当前客户端的实时连接。')}
    >
      <SettingsSection title={t('实时连接')}>
        <SettingsFieldGroup>
          <SettingsRow
            title={t('Socket 状态')}
            description={t('Anchor Chat 使用此连接接收实时消息和通知。')}
          >
            <Badge
              variant={socketConnected ? 'secondary' : 'destructive'}
              className={
                socketConnected
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : undefined
              }
            >
              <span
                className={
                  socketConnected
                    ? 'size-1.5 rounded-full bg-emerald-500'
                    : 'size-1.5 rounded-full bg-destructive'
                }
              />
              {socketConnected ? t('已连接') : t('已断开')}
            </Badge>
          </SettingsRow>
        </SettingsFieldGroup>
      </SettingsSection>

      <SettingsSection
        title={t('连接测试')}
        description={t('模拟重新连接以验证客户端恢复流程。')}
      >
        <Button variant="outline" onClick={() => socket.mockReconnect()}>
          <RefreshCwIcon />
          {t('模拟重连')}
        </Button>
      </SettingsSection>
    </SettingsPage>
  );
});
SettingsDebug.displayName = 'SettingsDebug';
