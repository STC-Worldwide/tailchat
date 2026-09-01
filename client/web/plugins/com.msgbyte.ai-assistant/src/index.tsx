import { regChatInputButton } from '@capital/common';
import { BaseChatInputButton } from '@capital/component';
import React from 'react';
import { AssistantPopover } from './popover';
import { Translate } from './translate';

const PLUGIN_ID = 'com.msgbyte.ai-assistant';
const PLUGIN_NAME = 'AI Assistant';

console.log(`Plugin ${PLUGIN_NAME}(${PLUGIN_ID}) is loaded`);

regChatInputButton({
  render: () => {
    return (
      <BaseChatInputButton
        icon="eos-icons:ai"
        ariaLabel={Translate.name}
        overlayClassName="w-[min(22rem,calc(100vw-1.5rem))]"
        popoverContent={({ hidePopover }) => (
          <AssistantPopover onCompleted={hidePopover} />
        )}
      />
    );
  },
});
