import React, { useEffect, useState } from 'react';
import {
  GroupExtraDataPanel,
  Markdown,
  MarkdownEditor,
} from '@capital/component';
import { Translate } from '../translate';

const MarkdownEditorRender: React.FC<{ dataMap: Record<string, string> }> =
  React.memo((props) => {
    const [text, setText] = useState(() => props.dataMap['markdown']);

    useEffect(() => {
      props.dataMap['markdown'] = text;
    }, [text]);

    return (
      <MarkdownEditor
        value={text}
        onChange={(val: string) => setText(val)}
        imageUsage="group"
      />
    );
  });
MarkdownEditorRender.displayName = 'MarkdownEditorRender';

const MarkdownPanel: React.FC = React.memo(() => {
  return (
    <GroupExtraDataPanel
      names={['markdown']}
      render={(dataMap: Record<string, string>) => {
        return (
          <div className="p-4">
            <Markdown raw={dataMap['markdown'] ?? ''} allowIframe={true} />
          </div>
        );
      }}
      renderEdit={(dataMap: Record<string, string>) => {
        return (
          <div className="flex h-[80vh] w-[min(80vw,1200px)] flex-col gap-2 overflow-hidden p-3 max-md:h-[calc(100dvh-1rem)] max-md:w-[calc(100vw-1rem)] max-md:p-2">
            <p className="pr-10 text-[13px] leading-5 text-muted-foreground">
              {Translate.editTip}
            </p>

            <div className="min-h-0 flex-1 overflow-hidden [&_.tailchat-markdown-editor]:h-full [&>div]:h-full">
              <MarkdownEditorRender dataMap={dataMap} />
            </div>
          </div>
        );
      }}
    />
  );
});
MarkdownPanel.displayName = 'MarkdownPanel';

export default MarkdownPanel;
