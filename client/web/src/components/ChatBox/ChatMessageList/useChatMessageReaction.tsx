import { EmojiPanel } from '@/components/Emoji';
import { useTcPopoverContext } from '@/components/TcPopover';
import React, { useMemo } from 'react';
import {
  addReaction,
  ChatMessage,
  useAsyncRequest,
  useUpdateRef,
} from 'tailchat-shared';
type PopoverRenderFunction = () => React.ReactNode;

/**
 * 消息的反应信息操作
 */
export function useChatMessageReactionAction(
  payload: ChatMessage
): PopoverRenderFunction {
  const payloadRef = useUpdateRef(payload);
  const Component = useMemo(
    () =>
      (() => {
        const { closePopover } = useTcPopoverContext();

        const [, handleSelect] = useAsyncRequest(async (code: string) => {
          await addReaction(payloadRef.current._id, code);
          closePopover();
        }, []);

        return <EmojiPanel onSelect={handleSelect} />;
      }) as PopoverRenderFunction,
    []
  );

  return Component;
}
