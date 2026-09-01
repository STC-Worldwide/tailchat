import React, { useCallback } from 'react';
import {
  ChatMessage,
  deleteMessage,
  PERMISSION,
  recallMessage,
  sharedEvent,
  showSuccessToasts,
  t,
  useAsyncRequest,
  useChatBoxContext,
  useGroupInfoContext,
  useHasGroupPermission,
  useUserInfo,
} from 'tailchat-shared';
import { openReconfirmModalP } from '@/components/Modal';
import copy from 'copy-to-clipboard';
import { getMessageTextDecorators } from '@/plugin/common';
import _compact from 'lodash/compact';
import type { TcDropdownMenu } from '@/components/ui/dropdown';
import {
  CopyIcon,
  LoaderCircleIcon,
  ReplyIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react';

/**
 * 消息的会话操作
 */
export function useChatMessageItemAction(
  payload: ChatMessage,
  options: { onClick?: () => void }
): TcDropdownMenu {
  const context = useChatBoxContext();
  const groupInfo = useGroupInfoContext();
  const userInfo = useUserInfo();
  const [hasDeleteMessagePermission] = useHasGroupPermission(
    groupInfo?._id ?? '',
    [PERMISSION.core.deleteMessage]
  );

  const handleCopy = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // 复制选中的文本
      copy(selection.toString());
      showSuccessToasts(t('复制选中文本成功'));
      return;
    }

    copy(getMessageTextDecorators().serialize(payload.content));
    showSuccessToasts(t('复制消息文本成功'));
  }, [payload.content]);

  const [{ loading: recallLoading }, handleRecallMessage] =
    useAsyncRequest(async () => {
      if (await openReconfirmModalP()) {
        await recallMessage(payload._id);
        showSuccessToasts(t('消息撤回成功'));
      }
    }, [payload._id]);

  const [{ loading: deleteLoading }, handleDeleteMessage] =
    useAsyncRequest(async () => {
      if (await openReconfirmModalP()) {
        await deleteMessage(payload._id);
        showSuccessToasts(t('消息删除成功'));
      }
    }, [payload._id]);

  const isGroupOwner = groupInfo && groupInfo.owner === userInfo?._id; //
  const isMessageAuthor = payload.author === userInfo?._id;

  return {
    onClick: options.onClick,
    items: _compact([
      {
        key: 'copy',
        label: t('复制'),
        icon: <CopyIcon className="size-4" />,
        onClick: handleCopy,
      },
      context.hasContext && {
        key: 'reply',
        label: t('回复'),
        icon: <ReplyIcon className="size-4" />,
        onClick: () => sharedEvent.emit('replyMessage', payload),
      },
      (isGroupOwner || isMessageAuthor) && {
        key: 'recall',
        label: t('撤回'),
        icon: recallLoading ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          <RotateCcwIcon className="size-4" />
        ),
        disabled: recallLoading || deleteLoading,
        onClick: handleRecallMessage,
      },
      hasDeleteMessagePermission && {
        key: 'delete',
        label: t('删除'),
        danger: true,
        icon: deleteLoading ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          <Trash2Icon className="size-4" />
        ),
        disabled: recallLoading || deleteLoading,
        onClick: handleDeleteMessage,
      },
    ] as TcDropdownMenu['items']),
  };
}
