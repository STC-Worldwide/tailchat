import React from 'react';
import { t } from 'tailchat-shared';
import { useChatInputActionContext } from './context';
import { EmojiPanel } from '@/components/Emoji';
import { BaseChatInputButton } from './BaseChatInputButton';
import { SmileIcon } from 'lucide-react';

export const ChatInputEmotion: React.FC = React.memo(() => {
  const actionContext = useChatInputActionContext();
  const { appendMsg } = actionContext;

  return (
    <BaseChatInputButton
      overlayClassName="emotion-popover bg-transparent border-0 shadow-none"
      iconNode={<SmileIcon />}
      ariaLabel={t('添加表情')}
      popoverContent={({ hidePopover }) => (
        <EmojiPanel
          onSelect={(code) => {
            appendMsg(code);
            hidePopover();
          }}
        />
      )}
    />
  );
});
ChatInputEmotion.displayName = 'ChatInputEmotion';
