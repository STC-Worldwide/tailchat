import React, { useMemo } from 'react';
import {
  BasicInboxItem,
  chatActions,
  InboxItem,
  isValidStr,
  model,
  t,
  useAppDispatch,
  useAsyncRequest,
  useInboxList,
} from 'tailchat-shared';
import _orderBy from 'lodash/orderBy';
import { GroupName } from '@/components/GroupName';
import { ConverseName } from '@/components/ConverseName';
import { getMessageRender, pluginInboxItemMap } from '@/plugin/common';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { PillTabPane, PillTabs } from '@/components/PillTabs';
import { SectionHeader } from '@/components/SectionHeader';
import { openReconfirmModalP } from '@/components/Modal';
import { CommonSidebarWrapper } from '@/components/CommonSidebarWrapper';
import { Virtuoso } from 'react-virtuoso';
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/official/sidebar';

const buildLink = (itemId: string) => `/main/inbox/${itemId}`;

/**
 * 收件箱侧边栏组件
 */
export const InboxSidebar: React.FC = React.memo(() => {
  const inbox = useInboxList();
  const list = useMemo(() => _orderBy(inbox, 'createdAt', 'desc'), [inbox]);
  const dispatch = useAppDispatch();

  const renderInbox = (item: InboxItem) => {
    if (item.type === 'message') {
      const payload: Partial<model.inbox.InboxItem['payload']> =
        item.message ?? item.payload ?? {};
      let title: React.ReactNode = '';
      if (isValidStr(payload.groupId)) {
        title = <GroupName groupId={payload.groupId} />;
      } else if (isValidStr(payload.converseId)) {
        title = <ConverseName converseId={payload.converseId} />;
      }

      return (
        <InboxSidebarItem
          key={item._id}
          title={title}
          desc={getMessageRender(payload.messageSnippet ?? '')}
          source={'Anchor Chat'}
          readed={item.readed}
          to={buildLink(item._id)}
        />
      );
    }

    if (item.type === 'markdown') {
      const payload: Partial<model.inbox.InboxItem['payload']> =
        item.payload ?? {};
      const title = payload.title || t('新消息');

      return (
        <InboxSidebarItem
          key={item._id}
          title={title}
          desc={t('点击查看详情')}
          source={payload.source ?? 'Anchor Chat'}
          readed={item.readed}
          to={buildLink(item._id)}
        />
      );
    }

    // For plugins
    const _item = item as BasicInboxItem;
    if (pluginInboxItemMap[_item.type]) {
      const info = pluginInboxItemMap[_item.type];
      const preview = info.getPreview(_item);

      return (
        <InboxSidebarItem
          key={_item._id}
          title={preview.title}
          desc={preview.desc}
          source={info.source ?? 'Unknown'}
          readed={_item.readed}
          to={buildLink(_item._id)}
        />
      );
    }

    return null;
  };

  const fullList = list;
  const unreadList = list.filter((item) => item.readed === false);

  const [, handleAllAck] = useAsyncRequest(async () => {
    unreadList.forEach((item) => {
      dispatch(chatActions.setInboxItemAck(item._id));
    });

    await model.inbox.setInboxAck(unreadList.map((item) => item._id));
  }, [unreadList]);

  const [, handleClear] = useAsyncRequest(async () => {
    const res = await openReconfirmModalP({
      title: t('确认清空收件箱么?'),
    });
    if (res) {
      await model.inbox.clearInbox();
    }
  }, [unreadList]);

  return (
    <CommonSidebarWrapper data-tc-role="sidebar-inbox">
      <SectionHeader
        menu={{
          items: [
            {
              key: 'readAll',
              label: t('所有已读'),
              onClick: handleAllAck,
            },
            {
              key: 'clear',
              label: t('清空收件箱'),
              danger: true,
              onClick: handleClear,
            },
          ],
        }}
      >
        {t('收件箱')}
      </SectionHeader>

      <div className="overflow-hidden flex-1">
        <PillTabs
          className="h-full"
          items={[
            {
              key: '1',
              label: `${t('全部')}`,
              children: (
                <Virtuoso
                  className="h-full"
                  data={fullList}
                  itemContent={(index, item) => renderInbox(item)}
                />
              ),
            },
            {
              key: '2',
              label: `${t('未读')} (${unreadList.length})`,
              children: (
                <Virtuoso
                  className="h-full"
                  data={unreadList}
                  itemContent={(index, item) => renderInbox(item)}
                />
              ),
            },
          ]}
        />
      </div>
    </CommonSidebarWrapper>
  );
});
InboxSidebar.displayName = 'InboxSidebar';

const InboxSidebarItem: React.FC<{
  title: React.ReactNode;
  desc: React.ReactNode;
  source: string;
  readed: boolean;
  to: string;
}> = React.memo((props) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(props.to);

  return (
    <SidebarMenu className="px-2 py-0.5">
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<Link to={props.to} />}
          isActive={isActive}
          size="lg"
          className="h-auto min-h-16 items-start rounded-lg py-2 pr-7 text-sidebar-foreground! no-underline data-active:bg-sidebar-accent! data-active:text-sidebar-accent-foreground!"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="truncate text-sm font-medium">
              {props.title || <span>&nbsp;</span>}
            </div>
            <div className="line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
              {props.desc}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {t('来自')}: {props.source}
            </div>
          </div>
        </SidebarMenuButton>

        {!props.readed && (
          <SidebarMenuBadge className="top-3">
            <span
              className="size-2 rounded-full bg-primary"
              aria-label="Unread"
            />
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
});
InboxSidebarItem.displayName = 'InboxSidebarItem';
