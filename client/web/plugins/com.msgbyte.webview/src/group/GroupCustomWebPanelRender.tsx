import React, { useState } from 'react';
import { Translate } from '../translate';
import { useWatch } from '@capital/common';
import {
  GroupExtraDataPanel,
  ModalWrapper,
  NoData,
  TextArea,
} from '@capital/component';
import { sanitizeCustomWebPanelHtml } from './sanitizeCustomWebPanelHtml';

function getInjectedStyle() {
  try {
    // 当前面板文本颜色
    const currentTextColor = document.defaultView.getComputedStyle(
      document.querySelector('.tc-content-background')
    ).color;

    return `<style>body { color: ${currentTextColor} }</style>`;
  } catch (e) {
    return '';
  }
}

const GroupCustomWebPanelRender: React.FC<{ html: string }> = (props) => {
  const html = props.html;

  if (!html) {
    return <NoData />;
  }

  return (
    <iframe
      title={Translate.customwebpanel}
      sandbox=""
      srcDoc={`${getInjectedStyle()}${sanitizeCustomWebPanelHtml(html)}`}
      className="h-full w-full bg-background"
    />
  );
};
GroupCustomWebPanelRender.displayName = 'GroupCustomWebPanelRender';

const GroupCustomWebPanelEditor: React.FC<{
  initValue: string;
  onChange: (html: string) => void;
}> = React.memo((props) => {
  const [html, setHtml] = useState(() => props.initValue ?? '');

  useWatch([html], () => {
    props.onChange(html);
  });

  return (
    <TextArea
      aria-label={Translate.editTip}
      className="h-full resize-none font-mono text-sm"
      value={html}
      onChange={(e) => setHtml(e.target.value)}
    />
  );
});
GroupCustomWebPanelEditor.displayName = 'GroupCustomWebPanelEditor';

const GroupCustomWebPanel: React.FC<{ panelInfo: any }> = (props) => {
  return (
    <GroupExtraDataPanel
      names={['html']}
      render={(dataMap: Record<string, string>) => {
        return (
          <GroupCustomWebPanelRender
            html={dataMap['html'] ?? props.panelInfo?.meta?.html ?? ''}
          />
        );
      }}
      renderEdit={(dataMap: Record<string, string>) => {
        return (
          <ModalWrapper
            title={Translate.customwebpanel}
            className="flex h-[80vh] w-[min(80vw,1200px)] flex-col gap-2 overflow-hidden p-3 max-md:h-[calc(100dvh-1rem)] max-md:w-[calc(100vw-1rem)] max-md:p-2"
          >
            <p className="pr-10 text-[13px] leading-5 text-muted-foreground">
              {Translate.editTip}
            </p>

            <div className="min-h-0 flex-1 overflow-hidden">
              <GroupCustomWebPanelEditor
                initValue={dataMap['html'] ?? props.panelInfo?.meta?.html ?? ''}
                onChange={(html) => (dataMap['html'] = html)}
              />
            </div>
          </ModalWrapper>
        );
      }}
    />
  );
};
GroupCustomWebPanel.displayName = 'GroupCustomWebPanel';

export default GroupCustomWebPanel;
