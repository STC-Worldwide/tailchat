import {
  getMessageTextDecorators,
  pluginChatInputActions,
} from '@/plugin/common';
import React, { useState } from 'react';
import { t } from 'tailchat-shared';
import { useChatInputActionContext } from './context';
import { uploadMessageFile, uploadMessageImage } from './utils';
import clsx from 'clsx';
import { openFile } from '@/utils/file-helper';
import { TcDropdown, type TcDropdownMenu } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/official/button';
import { FileIcon, ImageIcon, PlusIcon } from 'lucide-react';

export const ChatInputAddon: React.FC = React.memo(() => {
  const [open, setOpen] = useState(false);
  const actionContext = useChatInputActionContext();
  if (actionContext === null) {
    return null;
  }

  const handleSendImage = (file: File) => {
    // 发送图片
    const image = file;
    if (image) {
      // 发送图片
      uploadMessageImage(image).then(({ url, width, height }) => {
        actionContext.sendMsg(
          getMessageTextDecorators().image(url, { width, height })
        );
      });
    }
  };

  const handleSendFile = (file: File) => {
    // 发送文件
    if (file) {
      // 发送图片
      uploadMessageFile(file).then(({ name, url }) => {
        actionContext.sendMsg(
          getMessageTextDecorators().card(name, { type: 'file', url })
        );
      });
    }
  };

  const menu: TcDropdownMenu = {
    items: [
      {
        key: 'send-image',
        label: t('发送图片'),
        icon: <ImageIcon />,
        onClick: async () => {
          setOpen(false);
          const file = await openFile({ accept: 'image/*' });
          if (file) {
            handleSendImage(file);
          }
        },
      },
      {
        key: 'send-file',
        label: t('发送文件'),
        icon: <FileIcon />,
        onClick: async () => {
          setOpen(false);
          const file = await openFile();
          if (file) {
            handleSendFile(file);
          }
        },
      },
      ...pluginChatInputActions.map(
        (item, i) => ({
          key: item.label + i,
          label: item.label,
          onClick: () => {
            item.onClick(actionContext);
            setOpen(false);
          },
        })
      ),
    ],
  };

  return (
    <TcDropdown
      menu={menu}
      onOpenChange={setOpen}
      placement="topEnd"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('更多')}
        className="size-8 text-muted-foreground hover:text-foreground"
      >
        <PlusIcon
          className={clsx('transition-transform', {
            'rotate-45': open,
          })}
        />
      </Button>
    </TcDropdown>
  );
});
ChatInputAddon.displayName = 'ChatInputAddon';
