import { messageInterpreter } from '@/plugin/common';
import React from 'react';
import { useMemo } from 'react';
import { t } from 'tailchat-shared';
import { TcPopover } from '@/components/TcPopover';
import { Button } from '@/components/ui/official/button';
import { CircleHelpIcon } from 'lucide-react';

export function useRenderPluginMessageInterpreter(message: string) {
  const availableInterpreter = useMemo(
    () =>
      messageInterpreter
        .map(({ name, explainMessage }) => ({
          name,
          render: explainMessage(message),
        }))
        .filter(({ render }) => render !== null),
    [message]
  );

  if (availableInterpreter.length === 0) {
    return null;
  }

  return (
    <span className="ml-1 inline-flex align-middle">
      <TcPopover
        nativeButton={true}
        placement="topLeft"
        content={
          <div className="max-w-lg">
            <div className="mb-2 font-semibold">{t('消息解释')}</div>
            {availableInterpreter.map((ai, i) => (
              <p key={i + (ai.name ?? '')}>
                {ai.name && (
                  <span>
                    {t('来自')} <span className="font-bold">{ai.name}</span> :{' '}
                  </span>
                )}
                {ai.render}
              </p>
            ))}
          </div>
        }
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="align-middle text-muted-foreground"
          aria-label={t('消息解释')}
          title={t('消息解释')}
        >
          <CircleHelpIcon />
        </Button>
      </TcPopover>
    </span>
  );
}
