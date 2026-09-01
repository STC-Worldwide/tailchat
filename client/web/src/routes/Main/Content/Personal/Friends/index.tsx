import React, { useCallback, useState } from 'react';
import { AddFriend } from './AddFriend';
import {
  localTrans,
  t,
  useAppSelector,
  useGlobalConfigStore,
} from 'tailchat-shared';
import { RequestSend } from './RequestSend';
import { RequestReceived } from './RequestReceived';
import { FriendList } from './FriendList';
import _compact from 'lodash/compact';
import { Badge } from '@/components/ui/official/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/official/tabs';
import {
  InboxIcon,
  SendIcon,
  UserPlusIcon,
  UsersRoundIcon,
} from 'lucide-react';

/**
 * 主要内容组件
 */
export const FriendPanel: React.FC = React.memo(() => {
  const friendRequests = useAppSelector((state) => state.user.friendRequests);
  const userId = useAppSelector((state) => state.user.info?._id);
  const [activeKey, setActiveKey] = useState('all');
  const disableAddFriend = useGlobalConfigStore(
    (state) => state.disableAddFriend
  );

  const send = friendRequests.filter((item) => item.from === userId);
  const received = friendRequests.filter((item) => item.to === userId);

  const handleSwitchToAddFriend = useCallback(() => {
    setActiveKey('add');
  }, []);

  const items = _compact([
    {
      key: 'all',
      label: t('全部'),
      mobileLabel: t('全部'),
      icon: <UsersRoundIcon />,
      children: <FriendList onSwitchToAddFriend={handleSwitchToAddFriend} />,
    },
    !disableAddFriend && {
      key: 'sent',
      label: t('已发送'),
      mobileLabel: localTrans({ 'zh-CN': '已发', 'en-US': 'Sent' }),
      icon: <SendIcon />,
      count: send.length,
      children: <RequestSend requests={send} />,
    },
    !disableAddFriend && {
      key: 'received',
      label: t('待处理'),
      mobileLabel: localTrans({ 'zh-CN': '待办', 'en-US': 'Pending' }),
      icon: <InboxIcon />,
      count: received.length,
      children: <RequestReceived requests={received} />,
    },
    !disableAddFriend && {
      key: 'add',
      label: t('添加好友'),
      mobileLabel: localTrans({ 'zh-CN': '添加', 'en-US': 'Add' }),
      icon: <UserPlusIcon />,
      children: <AddFriend />,
    },
  ]);

  return (
    <Tabs
      value={activeKey}
      onValueChange={setActiveKey}
      className="h-full min-h-0 w-full gap-0 bg-background text-foreground"
    >
      <header className="flex h-14 shrink-0 items-center border-b bg-background/95 px-2 supports-backdrop-filter:backdrop-blur-sm md:px-4">
        <h1 className="mr-4 hidden shrink-0 text-base font-semibold md:block">
          {t('好友')}
        </h1>
        <TabsList
          variant="line"
          aria-label={t('好友')}
          className="h-14 min-w-0 flex-1 justify-start overflow-x-auto overflow-y-hidden rounded-none bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <TabsTrigger
              key={item.key}
              value={item.key}
              aria-label={item.label}
              className="h-14 flex-none gap-1.5 px-2 md:gap-2 md:px-3"
            >
              {item.icon}
              <span className="md:hidden">{item.mobileLabel}</span>
              <span className="hidden md:inline">{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <Badge
                  variant={item.key === 'received' ? 'default' : 'secondary'}
                  className="h-5 min-w-5 px-1.5 tabular-nums"
                >
                  {item.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </header>

      {items.map((item) => (
        <TabsContent
          key={item.key}
          value={item.key}
          className="min-h-0 flex-1 overflow-hidden"
        >
          {item.children}
        </TabsContent>
      ))}
    </Tabs>
  );
});
FriendPanel.displayName = 'FriendPanel';
