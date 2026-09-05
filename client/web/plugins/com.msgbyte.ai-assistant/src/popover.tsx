import React from 'react';
import { Translate } from './translate';
import {
  useAsyncRequest,
  useConverseMessageContext,
  getCachedUserInfo,
  getMessageTextDecorators,
} from '@capital/common';
import {
  LoadingSpinner,
  useChatInputActionContext,
  Tag,
  Button,
  Divider,
  Icon,
} from '@capital/component';
import axios from 'axios';
import {
  improveTextPrompt,
  longerTextPrompt,
  shorterTextPrompt,
  summaryMessagesPrompt,
  translateTextPrompt,
} from './prompt';

const ActionButton: React.FC<{
  children: React.ReactNode;
  icon: string;
  onClick: () => void | Promise<void>;
}> = ({ children, icon, onClick }) => (
  <Button
    block={true}
    type="text"
    className="h-auto min-h-9 justify-start whitespace-normal px-3 py-2 text-left font-normal"
    icon={<Icon aria-hidden="true" icon={icon} />}
    onClick={onClick}
  >
    {children}
  </Button>
);

export const AssistantPopover: React.FC<{
  onCompleted: () => void;
}> = React.memo((props) => {
  const { messages } = useConverseMessageContext();
  const { message, setMessage } = useChatInputActionContext();
  const [{ loading, value }, handleCallAI] = useAsyncRequest(
    async (question: string) => {
      // TODO: wait for replace
      const { data } = await axios.post('https://yyejoq.laf.dev/chatgpt', {
        question: `You are BASsie, the AI assistant in Anchor Chat by STC Worldwide.\n${question}`,
      });

      return data;
    },
    []
  );

  if (loading) {
    return (
      <div
        className="flex min-h-32 w-full items-center justify-center p-4"
        role="status"
      >
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 p-3">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Icon
            aria-hidden="true"
            className="text-lg text-primary"
            icon="eos-icons:ai"
          />
          <h2 className="text-sm font-semibold text-foreground">
            {Translate.name}
          </h2>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          {Translate.description}
        </p>
      </header>

      <div aria-live="polite">
        {typeof value === 'object' && (
          <>
            {value.result ? (
              <section
                aria-label={Translate.result}
                className="space-y-3 rounded-lg border border-border bg-muted/40 p-3"
              >
                <div className="max-h-[40vh] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                  {value.answer}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Tag color="green">
                    {Translate.usage}: {value.usage}ms
                  </Tag>

                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      setMessage(value.answer);
                      props.onCompleted();
                    }}
                  >
                    {Translate.apply}
                  </Button>
                </div>
              </section>
            ) : (
              <div
                className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3"
                role="alert"
              >
                <p className="text-sm text-foreground">
                  {Translate.serviceBusy}
                </p>
                <Tag color="red">{Translate.callError}</Tag>
              </div>
            )}

            <Divider className="mt-3" />
          </>
        )}
      </div>

      <section aria-labelledby="ai-assistant-actions" className="space-y-1">
        <h3
          className="px-2 text-xs font-medium text-muted-foreground"
          id="ai-assistant-actions"
        >
          {Translate.helpMeTo}
        </h3>

        <ActionButton
          icon="mdi:text-box-search-outline"
          onClick={async () => {
            const plainMessages = (
              await Promise.all(
                [...messages]
                  .filter(
                    (item): item is typeof item & { author: string } =>
                      !item.hasRecall && typeof item.author === 'string'
                  ) // filter recalled and unauthored system messages
                  .slice(messages.length - 30, messages.length) // get last 30 message, too much will throw error
                  .map(
                    async (item) =>
                      `${
                        (
                          await getCachedUserInfo(item.author)
                        ).nickname
                      }: ${getMessageTextDecorators().serialize(
                        item.content ?? ''
                      )}`
                  )
              )
            ).join('\n');

            handleCallAI(summaryMessagesPrompt + '\n' + plainMessages);
          }}
        >
          {Translate.summaryMessages}
        </ActionButton>

        {typeof message === 'string' && message.length > 0 ? (
          <>
            <ActionButton
              icon="mdi:auto-fix"
              onClick={() => handleCallAI(improveTextPrompt + message)}
            >
              {Translate.improveText}
            </ActionButton>
            <ActionButton
              icon="mdi:format-line-spacing"
              onClick={() => handleCallAI(shorterTextPrompt + message)}
            >
              {Translate.makeShorter}
            </ActionButton>
            <ActionButton
              icon="mdi:arrow-expand-vertical"
              onClick={() => handleCallAI(longerTextPrompt + message)}
            >
              {Translate.makeLonger}
            </ActionButton>
            <ActionButton
              icon="mdi:translate"
              onClick={() => handleCallAI(translateTextPrompt + message)}
            >
              {Translate.translateInputText}
            </ActionButton>
          </>
        ) : (
          <p className="px-2 pt-2 text-xs leading-5 text-muted-foreground">
            {Translate.inputTextShowMoreActionTip}
          </p>
        )}
      </section>
    </div>
  );
});
AssistantPopover.displayName = 'AssistantPopover';
