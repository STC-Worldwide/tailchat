import React from 'react';
import { Translate } from '../translate';
import { GroupPanelContainer, WebviewKeepAlive } from '@capital/component';
import urlRegex from 'url-regex';
import { useGlobalConfigStore, useGroupPanelContext } from '@capital/common';
import { isOriginAllowed } from './isOriginAllowed';

const GroupWebPanelRender: React.FC<{ panelInfo: any }> = (props) => {
  const { groupId, panelId } = useGroupPanelContext();
  const panelInfo = props.panelInfo;
  const allowlist = useGlobalConfigStore(
    (state: any) => state.webviewOriginAllowlist
  );

  if (!panelInfo) {
    return <div>{Translate.notfound}</div>;
  }

  let url = String(panelInfo?.meta?.url);
  if (
    !url.includes('://') &&
    urlRegex({ exact: true, strict: false }).test(url)
  ) {
    // 不包含协议, 但是是个网址
    url = 'https://' + url;
  }
  const background = panelInfo?.meta?.background ?? false;

  // Which origins may be embedded is the server's decision. A blocked panel
  // says so rather than rendering an empty frame — a blank panel reads as a
  // broken site, and nobody would know to ask for the origin to be allowed.
  if (!isOriginAllowed(url, allowlist)) {
    return (
      <GroupPanelContainer groupId={groupId} panelId={panelId}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-6 text-center">
          <div className="text-base font-medium">{Translate.blockedTitle}</div>
          <div className="text-sm opacity-70">{Translate.blockedDesc}</div>
          <code className="mt-2 text-xs opacity-60">{url}</code>
        </div>
      </GroupPanelContainer>
    );
  }

  return (
    <GroupPanelContainer groupId={groupId} panelId={panelId}>
      <WebviewKeepAlive
        key={String(url)}
        className={`w-full h-full ${background ? 'bg-white' : ''}`}
        url={url}
      />
    </GroupPanelContainer>
  );
};
GroupWebPanelRender.displayName = 'GroupWebPanelRender';

export default GroupWebPanelRender;
