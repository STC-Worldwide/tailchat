import React, { useMemo, useState } from 'react';
import {
  ChatMessage,
  formatShortTime,
  shouldShowMessageTime,
  SYSTEM_USERID,
  t,
  useCachedUserInfo,
  MessageHelper,
  showMessageTime,
  useUserInfoList,
  UserBaseInfo,
  useUserSettings,
} from 'tailchat-shared';
import { useRenderPluginMessageInterpreter } from './useRenderPluginMessageInterpreter';
import { getMessageRender, pluginMessageExtraParsers } from '@/plugin/common';
import { UserName } from '@/components/UserName';
import clsx from 'clsx';
import { useChatMessageItemAction } from './useChatMessageItemAction';
import { useChatMessageReactionAction } from './useChatMessageReaction';
import { TcPopover } from '@/components/TcPopover';
import { useMessageReactions } from './useMessageReactions';
import { stopPropagation } from '@/utils/dom-helper';
import { MessageAckContainer } from './MessageAckContainer';
import { UserPopover } from '@/components/popover/UserPopover';
import {
  TcDropdown,
  TcContextMenu,
  type TcDropdownMenu,
} from '@/components/ui/dropdown';
import { TcSeparator } from '@/components/ui/separator';
import _isEmpty from 'lodash/isEmpty';
import type { LocalChatMessage } from 'tailchat-shared/model/message';
import { Button } from '@/components/ui/official/button';
import { CircleXIcon, EllipsisIcon, SmilePlusIcon } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';
import { ExpandableMessage } from './ExpandableMessage';

/**
 * 消息引用
 */
const MessageQuote: React.FC<{ payload: ChatMessage }> = React.memo(
  ({ payload }) => {
    const quote = useMemo(
      () => new MessageHelper(payload).hasReply(),
      [payload]
    );

    if (quote === false) {
      return null;
    }

    return (
      <div className="chat-message-item_quote border-l border-border pl-2 text-muted-foreground [&_img]:max-h-15 [&_img]:w-auto!">
        {t('回复')} <UserName userId={String(quote.author)} />:{' '}
        <span>{getMessageRender(quote.content)}</span>
      </div>
    );
  }
);
MessageQuote.displayName = 'MessageQuote';

const MessageActionIcon = React.forwardRef<
  HTMLButtonElement,
  {
    icon: React.ReactNode;
    label: string;
  } & Omit<React.ComponentPropsWithoutRef<typeof Button>, 'children'>
>(({ icon, label, ...buttonProps }, ref) => (
  <Button
    ref={ref}
    type="button"
    variant="ghost"
    size="icon-xs"
    aria-label={label}
    title={label}
    className="text-muted-foreground hover:text-foreground mobile:size-11"
    {...buttonProps}
  >
    {icon}
  </Button>
));
MessageActionIcon.displayName = 'MessageActionIcon';

/**
 * 普通消息
 */
export const NormalMessage: React.FC<ChatMessageItemProps> = React.memo(
  (props) => {
    const { showAvatar, payload, hideAction = false } = props;
    const userInfo = useCachedUserInfo(payload.author ?? '');
    const [isActionBtnActive, setIsActionBtnActive] = useState(false);
    const { settings } = useUserSettings();

    const reactions = useMessageReactions(payload);

    const emojiAction = useChatMessageReactionAction(payload);
    const moreActions = useChatMessageItemAction(payload, {
      onClick: () => {
        setIsActionBtnActive(false);
      },
    });

    // 禁止对消息进行操作，因为此时消息尚未发送到远程
    const disableOperate =
      hideAction === true ||
      payload.isLocal === true ||
      payload.sendFailed === true;

    return (
      <div
        className={clsx(
          'chat-message-item group relative flex select-text px-2 py-[var(--tc-msg-row-pad)] text-[length:var(--tc-msg-font-size)] leading-[var(--tc-msg-line-height)] mobile:px-0',
          // 分组首条消息与上一组拉开间距; 间距值由密度设置驱动
          // min-h-11 (44px) 锁定头像行节奏, 避免短消息挤压
          showAvatar && 'mt-[var(--tc-msg-group-gap)] min-h-11',
          !disableOperate && 'mobile:pb-12',
          {
            'bg-accent/60': isActionBtnActive,
            'hover:bg-accent/35': !isActionBtnActive,
          }
        )}
        data-message-id={payload._id}
      >
        {/* 头像 */}
        <div className="w-18 mobile:w-14 flex items-start justify-center pt-0.5">
          {showAvatar ? (
            <TcPopover
              nativeButton={true}
              content={
                !_isEmpty(userInfo) && (
                  <UserPopover userInfo={userInfo as UserBaseInfo} />
                )
              }
              placement="top"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={userInfo.nickname || t('查看用户信息')}
                className="size-10 rounded-full p-0"
              >
                <Avatar size="lg">
                  <AvatarImage
                    src={userInfo.avatar || undefined}
                    alt={userInfo.nickname || ''}
                  />
                  <AvatarFallback className="font-medium">
                    {userInfo.nickname?.slice(0, 1).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </TcPopover>
          ) : (
            <div className="hidden group-hover:block text-xs text-muted-foreground leading-[var(--tc-msg-line-height)]">
              {formatShortTime(payload.createdAt)}
            </div>
          )}
        </div>

        {/* 主体 */}
        <TcContextMenu
          menu={moreActions as unknown as TcDropdownMenu}
          disabled={settings['disableMessageContextMenu']}
          onOpenChange={setIsActionBtnActive}
        >
          <div
            className="group flex min-w-0 flex-1 flex-col overflow-visible"
            onContextMenu={stopPropagation}
          >
            {showAvatar && (
              <div className="flex min-w-0 items-baseline gap-2">
                <div className="truncate font-semibold text-foreground">
                  {userInfo.nickname || <span>&nbsp;</span>}
                </div>
                {/* 分组首条的时间常显, 不再只在 hover 时出现 */}
                <div className="shrink-0 text-xs text-muted-foreground">
                  {formatShortTime(payload.createdAt)}
                </div>
              </div>
            )}

            {/* 消息内容 */}
            <ExpandableMessage maxHeight={340} expandLabel={t('点击展开更多')}>
              <div className="chat-message-item_body break-words font-sans text-foreground [&_code]:font-mono [&_pre]:font-mono [&_.emoji-mart-emoji]:mx-1 [&_.emoji-mart-emoji]:inline-block [&_.emoji-mart-emoji]:h-4 [&_.emoji-mart-emoji>span]:align-top">
                <MessageQuote payload={payload} />

                <span>{getMessageRender(payload.content)}</span>

                {payload.sendFailed === true && (
                  <CircleXIcon
                    className="ml-1 inline-block size-4 text-destructive"
                    aria-label={t('发送失败')}
                  />
                )}

                {/* 解释器按钮 */}
                {useRenderPluginMessageInterpreter(payload.content)}
              </div>
            </ExpandableMessage>

            {/* 额外渲染 */}
            <div>
              {pluginMessageExtraParsers.map((parser) => (
                <React.Fragment key={parser.name}>
                  {parser.render(payload)}
                </React.Fragment>
              ))}
            </div>

            {/* 消息反应 */}
            {reactions}
          </div>
        </TcContextMenu>

        {/* 操作 */}
        {!disableOperate && (
          <div
            className={clsx(
              'pointer-events-none absolute -top-3 right-2 flex overflow-hidden rounded-lg border border-border bg-popover p-0.5 text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 mobile:top-auto mobile:right-2 mobile:bottom-1 mobile:border-0 mobile:bg-transparent mobile:p-0 mobile:opacity-100 mobile:shadow-none mobile:pointer-events-auto',
              {
                'pointer-events-auto opacity-100': isActionBtnActive,
              }
            )}
          >
            <TcPopover
              nativeButton={true}
              overlayClassName="chat-message-item_action-popover p-1"
              content={emojiAction}
              placement="bottomLeft"
              onOpenChange={setIsActionBtnActive}
            >
              <MessageActionIcon
                icon={<SmilePlusIcon />}
                label={t('添加反应')}
              />
            </TcPopover>

            <TcDropdown
              menu={moreActions as unknown as TcDropdownMenu}
              placement="bottomEnd"
              onOpenChange={setIsActionBtnActive}
            >
              <MessageActionIcon icon={<EllipsisIcon />} label={t('更多')} />
            </TcDropdown>
          </div>
        )}
      </div>
    );
  }
);
NormalMessage.displayName = 'NormalMessage';

/**
 * 系统消息
 */
const SystemMessage: React.FC<ChatMessageItemProps> = React.memo(
  ({ payload }) => {
    return (
      <div className="text-center">
        <div className="mx-2 my-1 inline-block rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">
          {payload.content}
        </div>
      </div>
    );
  }
);
SystemMessage.displayName = 'SystemMessage';

/**
 * 带userId => nickname异步解析的SystemMessage 组件
 */
const SystemMessageWithNickname: React.FC<
  ChatMessageItemProps & {
    userIds: string[];
    overwritePayload: (nicknameList: string[]) => ChatMessage;
  }
> = React.memo((props) => {
  const userInfos = useUserInfoList(props.userIds);
  const nicknameList = userInfos.map((user) => user.nickname);

  return (
    <SystemMessage {...props} payload={props.overwritePayload(nicknameList)} />
  );
});
SystemMessageWithNickname.displayName = 'SystemMessageWithNickname';

interface ChatMessageItemProps {
  showAvatar: boolean;
  payload: LocalChatMessage;
  hideAction?: boolean;
}
const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo((props) => {
  const payload = props.payload;
  if (payload.author === SYSTEM_USERID) {
    // 系统消息
    return <SystemMessage {...props} />;
  } else if (payload.hasRecall === true) {
    // 撤回消息
    return (
      <SystemMessageWithNickname
        {...props}
        userIds={[payload.author ?? SYSTEM_USERID]}
        overwritePayload={(nicknameList) => ({
          ...payload,
          content: t('{{nickname}} 撤回了一条消息', {
            nickname: nicknameList[0] || '',
          }),
        })}
      />
    );
  }

  // 普通消息
  return <NormalMessage {...props} />;
});
ChatMessageItem.displayName = 'ChatMessageItem';

/**
 * 构造聊天项
 */
export function buildMessageItemRow(
  messages: LocalChatMessage[],
  index: number
) {
  const message = messages[index];

  if (!message) {
    return <div />;
  }

  let showDate = true;
  let showAvatar = true;
  const messageCreatedAt = new Date(message.createdAt ?? '');
  if (index > 0) {
    // 当不是第一条数据时

    // 进行时间合并
    const prevMessage = messages[index - 1];
    if (
      !shouldShowMessageTime(
        new Date(prevMessage.createdAt ?? ''),
        messageCreatedAt
      )
    ) {
      showDate = false;
    }

    // 进行头像合并(在同一时间块下 且发送者为同一人)
    if (showDate === false) {
      showAvatar =
        prevMessage.author !== message.author || prevMessage.hasRecall === true;
    }
  }

  return (
    <div key={message._id}>
      {showDate && (
        <TcSeparator className="my-4 px-6 text-xs font-normal select-text">
          {showMessageTime(messageCreatedAt)}
        </TcSeparator>
      )}

      {message.isLocal === true ? (
        <div className="opacity-50">
          <ChatMessageItem showAvatar={showAvatar} payload={message} />
        </div>
      ) : (
        <MessageAckContainer
          converseId={message.converseId}
          messageId={message._id}
        >
          <ChatMessageItem showAvatar={showAvatar} payload={message} />
        </MessageAckContainer>
      )}
    </div>
  );
}
