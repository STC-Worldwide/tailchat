import React from 'react';
import { t } from 'tailchat-shared';
import { HashIcon } from 'lucide-react';

export const ChatMessageHeader: React.FC<{
  title: React.ReactNode;
}> = React.memo((props) => {
  return (
    <div className="px-5 pt-10 pb-5">
      <div className="mb-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
        <HashIcon className="size-6 text-muted-foreground" aria-hidden="true" />
        <h2>{props.title}</h2>
      </div>
      <div className="max-w-[65ch] text-sm text-muted-foreground">
        {t('这里是所有消息的开始，请畅所欲言。')}
      </div>
    </div>
  );
});
ChatMessageHeader.displayName = 'ChatMessageHeader';
