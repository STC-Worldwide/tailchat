import { ChevronRightIcon } from 'lucide-react';
import React from 'react';
import { useLocation, useMatch } from 'react-router';
import {
  localTrans,
  t,
  useGroupInfo,
  useGroupPanelInfo,
} from 'tailchat-shared';

function getPersonalDetail(pathname: string): string | null {
  if (pathname.includes('/friends')) {
    return t('好友');
  }
  if (pathname.includes('/plugins')) {
    return t('插件中心');
  }
  if (pathname.includes('/converse/')) {
    return localTrans({ 'zh-CN': '私信', 'en-US': 'Direct message' });
  }

  return null;
}

export const AppShellHeader: React.FC = React.memo(() => {
  const location = useLocation();
  const groupMatch = useMatch('/main/group/:groupId/:panelId');
  const groupId = groupMatch?.params.groupId ?? '';
  const panelId = groupMatch?.params.panelId ?? '';
  const group = useGroupInfo(groupId);
  const panel = useGroupPanelInfo(groupId, panelId);

  let section = localTrans({ 'zh-CN': '个人', 'en-US': 'Personal' });
  let detail: string | null = getPersonalDetail(location.pathname);

  if (location.pathname.startsWith('/main/inbox')) {
    section = t('收件箱');
    detail = null;
  } else if (location.pathname.startsWith('/main/group/')) {
    section = group?.name ?? localTrans({ 'zh-CN': '群组', 'en-US': 'Group' });
    detail = panel?.name ?? null;
  }

  return (
    <nav
      aria-label={localTrans({
        'zh-CN': '当前位置',
        'en-US': 'Current location',
      })}
      className="flex min-w-0 items-center gap-1.5 text-sm"
    >
      <span className="truncate font-medium text-foreground">{section}</span>
      {detail && (
        <>
          <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">{detail}</span>
        </>
      )}
    </nav>
  );
});
AppShellHeader.displayName = 'AppShellHeader';
