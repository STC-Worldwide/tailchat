import {
  addReaction,
  ChatMessage,
  isValidStr,
  removeReaction,
  useUserId,
  useUsernames,
} from 'tailchat-shared';
import _groupBy from 'lodash/groupBy';
import _uniqBy from 'lodash/uniqBy';
import { useCallback, useMemo } from 'react';
import { Emoji } from '@/components/Emoji';
import React from 'react';
import { TcTooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/official/button';
import { cn } from '@/lib/utils';

interface GroupedReaction {
  name: string;
  length: number;
  users: string[];
}

/**
 * 消息反应的用户名
 */
const ReactionItem: React.FC<{
  reaction: GroupedReaction;
  active: boolean;
  onClick: () => void;
}> = React.memo((props) => {
  const { reaction, active, onClick } = props;
  const usernames = useUsernames(reaction.users);

  return (
    <TcTooltip label={usernames.join(', ')}>
      <Button
        type="button"
        variant={active ? 'secondary' : 'outline'}
        size="sm"
        aria-label={`${reaction.name}: ${usernames.join(', ')}`}
        aria-pressed={active}
        className={cn(
          'h-7 rounded-lg border-border bg-background/70 px-2 text-xs font-normal shadow-none hover:bg-accent mobile:h-11 mobile:min-w-11',
          active && 'border-primary/40 bg-primary/10 text-foreground'
        )}
        onClick={onClick}
      >
        <div className="flex items-center [&_.emoji-mart-emoji]:flex [&_.emoji-mart-emoji]:items-center">
          <Emoji emoji={reaction.name} />
          <span className="ml-1 tabular-nums text-muted-foreground">
            {reaction.length}
          </span>
        </div>
      </Button>
    </TcTooltip>
  );
});
ReactionItem.displayName = 'ReactionItem';

/**
 * 消息反应表情渲染
 */
export function useMessageReactions(payload: ChatMessage) {
  const messageId = payload._id;
  const reactions = payload.reactions ?? [];
  const userId = useUserId();

  const groupedReactions: GroupedReaction[] = useMemo(() => {
    const groups = _groupBy(reactions, 'name');

    return Object.keys(groups).map((name) => {
      const reactions = _uniqBy(groups[name], 'author');
      return {
        name,
        length: reactions.length,
        users: reactions.map((r) => r.author),
      };
    });
  }, [reactions]);

  const handleClick = useCallback(
    (reaction: GroupedReaction) => {
      if (!isValidStr(userId)) {
        return;
      }

      if (reaction.users.includes(userId)) {
        removeReaction(messageId, reaction.name);
      } else {
        addReaction(messageId, reaction.name);
      }
    },
    [messageId, userId]
  );

  return (
    <div className="chat-message-reactions flex flex-wrap gap-1 py-1">
      {groupedReactions.map((reaction) => (
        <ReactionItem
          key={reaction.name}
          reaction={reaction}
          active={reaction.users.includes(userId ?? '')}
          onClick={() => handleClick(reaction)}
        />
      ))}
    </div>
  );
}
