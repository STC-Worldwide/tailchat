import React from 'react';
import { t, useChatBoxContext, useSharedEventHandler } from 'tailchat-shared';
import _isNil from 'lodash/isNil';
import { getMessageRender } from '@/plugin/common';
import { UserName } from '../UserName';
import { Button } from '@/components/ui/official/button';
import { ReplyIcon, XIcon } from 'lucide-react';

export const ChatReply: React.FC = React.memo(() => {
  const { replyMsg, setReplyMsg, clearReplyMsg } = useChatBoxContext();

  useSharedEventHandler('replyMessage', (payload) => {
    /**
     * 这里故意在本组件设置回复消息体而不是在事件发起方设置是为了确保当本组件不存在时
     * 不会出现回复消息的值呗设置的情况
     */
    setReplyMsg(payload);
  });

  if (_isNil(replyMsg)) {
    return null;
  }

  return (
    <div className="relative z-10 h-0">
      <div className="absolute inset-x-4 bottom-1">
        <div className="relative flex max-h-44 items-start gap-2 overflow-auto rounded-lg border border-border bg-popover p-2.5 pr-10 text-sm text-popover-foreground shadow-md">
          <ReplyIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <span className="font-medium">
              {t('回复')}{' '}
              {replyMsg.author && <UserName userId={replyMsg.author} />}:{' '}
            </span>
            <span className="text-muted-foreground">
              {getMessageRender(replyMsg.content)}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute top-1.5 right-1.5"
            aria-label={t('取消回复')}
            title={t('取消回复')}
            onClick={clearReplyMsg}
          >
            <XIcon />
          </Button>
        </div>
      </div>
    </div>
  );
});
ChatReply.displayName = 'ChatReply';
