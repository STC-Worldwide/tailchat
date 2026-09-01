import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';
import { TcPopover, useTcPopoverContext } from '@/components/TcPopover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/official/button';

interface BaseChatInputButtonProps {
  overlayClassName?: string;
  icon?: string;
  iconNode?: React.ReactNode;
  ariaLabel?: string;
  popoverContent: (ctx: { hidePopover: () => void }) => React.ReactElement;
}

const BaseChatInputButtonContent: React.FC<{
  popoverContent: BaseChatInputButtonProps['popoverContent'];
}> = ({ popoverContent }) => {
  const { closePopover } = useTcPopoverContext();

  return popoverContent({ hidePopover: closePopover });
};

export const BaseChatInputButton: React.FC<BaseChatInputButtonProps> =
  React.memo((props) => {
    return (
      <TcPopover
        nativeButton={true}
        content={
          <BaseChatInputButtonContent popoverContent={props.popoverContent} />
        }
        overlayClassName={cn(
          'chat-message-input_action-popover p-0',
          props.overlayClassName
        )}
        placement="topRight"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={props.ariaLabel ?? props.icon}
          title={props.ariaLabel}
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          {props.iconNode ??
            (props.icon ? (
              <IconifyIcon className="text-xl" icon={props.icon} />
            ) : null)}
        </Button>
      </TcPopover>
    );
  });
BaseChatInputButton.displayName = 'BaseChatInputButton';
