import React from 'react';
import { ChevronsDownIcon } from 'lucide-react';
import { t } from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';

interface Props {
  onClick: () => void;
}

/**
 * 滚动到底部的按钮
 */
export const ScrollToBottom: React.FC<Props> = React.memo((props) => {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={t('滚动到底部')}
      title={t('滚动到底部')}
      className="absolute right-5 bottom-20 z-10 size-10 rounded-full border border-border bg-background/95 text-foreground shadow-md backdrop-blur-sm"
      onClick={props.onClick}
    >
      <ChevronsDownIcon />
    </Button>
  );
});
ScrollToBottom.displayName = 'ScrollToBottom';
