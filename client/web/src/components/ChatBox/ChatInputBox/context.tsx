import React, { PropsWithChildren, useContext } from 'react';
import { useShallowObject } from 'tailchat-shared';

export interface ChatInputSuggestionItem {
  id: string | number;
  display?: string;
}

/**
 * Input Actions
 */
export interface ChatInputActionContextProps {
  message: string;
  setMessage: (msg: string) => void;
  sendMsg: (message: string) => void;
  appendMsg: (message: string) => void;
}
export const ChatInputActionContext =
  React.createContext<ChatInputActionContextProps>(
    {} as ChatInputActionContextProps
  );
ChatInputActionContext.displayName = 'ChatInputActionContext';

export function useChatInputActionContext() {
  return useContext(ChatInputActionContext);
}

/**
 * Input Mentions
 */
interface ChatInputMentionsContextProps extends PropsWithChildren {
  users?: ChatInputSuggestionItem[];
  panels?: ChatInputSuggestionItem[];
  placeholder?: string;
  disabled?: boolean;
}
const ChatInputMentionsContext =
  React.createContext<ChatInputMentionsContextProps | null>(null);
ChatInputMentionsContext.displayName = 'ChatInputMentionsContext';

export const ChatInputMentionsContextProvider: React.FC<ChatInputMentionsContextProps> =
  React.memo((props) => {
    return (
      <ChatInputMentionsContext.Provider value={useShallowObject({ ...props })}>
        {props.children}
      </ChatInputMentionsContext.Provider>
    );
  });
ChatInputMentionsContextProvider.displayName =
  'ChatInputMentionsContextProvider';

export function useChatInputMentionsContext(): ChatInputMentionsContextProps {
  const context = useContext(ChatInputMentionsContext);

  return {
    users: context?.users ?? [],
    panels: context?.panels ?? [],
    placeholder: context?.placeholder,
    disabled: context?.disabled,
  };
}
