import React from 'react';
import {
  groupActions,
  GroupPanel,
  GroupPanelType,
  isValidStr,
  PERMISSION,
  showToasts,
  t,
  useAppDispatch,
  useConverseAck,
  useGroupInfo,
  useHasGroupPanelPermission,
  useUserNotifyMute,
} from 'tailchat-shared';
import { GroupPanelItem } from '@/components/GroupPanelItem';
import { GroupAckPanelItem } from './AckPanelItem';
import copy from 'copy-to-clipboard';
import { usePanelWindow } from '@/hooks/usePanelWindow';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import _compact from 'lodash/compact';
import {
  type GroupPanelMenuItem,
  useExtraMenuItems,
  useGroupPanelExtraBadge,
} from './utils';
import { isGroupAckPanel } from '@/utils/group-helper';
import {
  BellOffIcon,
  CopyIcon,
  HashIcon,
  MessageCircleMoreIcon,
  PanelTopOpenIcon,
  PinIcon,
  PinOffIcon,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/official/context-menu';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';

/**
 * 群组面板侧边栏组件
 */
export const SidebarItem: React.FC<{
  groupId: string;
  panel: GroupPanel;
  nested?: boolean;
}> = React.memo((props) => {
  const { groupId, panel } = props;
  const panelId = panel.id;
  const { hasOpenedPanel, openPanelWindow } = usePanelWindow(
    `/panel/group/${groupId}/${panelId}`
  );
  const groupInfo = useGroupInfo(groupId);
  const dispatch = useAppDispatch();
  const { markConverseAllAck } = useConverseAck(panelId);
  const extraMenuItems = useExtraMenuItems(panel);
  const extraBadge = useGroupPanelExtraBadge(
    groupId,
    panelId,
    panel.pluginPanelName ?? ''
  );
  const { checkIsMuted, toggleMute } = useUserNotifyMute();
  const [viewPanelPermission] = useHasGroupPanelPermission(groupId, panelId, [
    PERMISSION.core.viewPanel,
  ]);
  const portalContainer = useAppPortalContainer();

  if (!groupInfo) {
    return <LoadingSpinner />;
  }

  if (!viewPanelPermission) {
    return null;
  }

  const isPinned =
    isValidStr(groupInfo.pinnedPanelId) && groupInfo.pinnedPanelId === panelId;

  const menuItems = _compact([
    {
      key: 'copy',
      label: t('复制链接'),
      icon: <CopyIcon />,
      onClick: () => {
        copy(`${location.origin}/main/group/${groupId}/${panelId}`);
        showToasts(t('已复制到剪切板'));
      },
    },
    {
      key: 'new',
      label: t('在新窗口打开'),
      icon: <PanelTopOpenIcon />,
      disabled: hasOpenedPanel,
      onClick: openPanelWindow,
    },
    isPinned
      ? {
          key: 'unpin',
          label: t('Unpin'),
          icon: <PinOffIcon />,
          onClick: () => {
            dispatch(
              groupActions.unpinGroupPanel({
                groupId,
              })
            );
          },
        }
      : {
          key: 'pin',
          label: t('Pin'),
          icon: <PinIcon />,
          onClick: () => {
            dispatch(
              groupActions.pinGroupPanel({
                groupId,
                panelId: panelId,
              })
            );
          },
        },
    panel.type === GroupPanelType.TEXT && {
      key: 'markAsRead',
      label: t('标记为已读'),
      icon: <MessageCircleMoreIcon />,
      onClick: markConverseAllAck,
    },
    panel.type === GroupPanelType.TEXT && {
      key: 'mute',
      label: checkIsMuted(panelId, groupId) ? t('取消免打扰') : t('免打扰'),
      icon: <BellOffIcon />,
      onClick: () => toggleMute(panelId),
    },
    ...(extraMenuItems ?? []),
  ]) as GroupPanelMenuItem[];

  const icon = isPinned ? <PinIcon /> : <HashIcon />;
  const panelItem = isGroupAckPanel(panel) ? (
    <GroupAckPanelItem
      icon={icon}
      groupId={groupId}
      panel={panel}
      nested={props.nested}
    />
  ) : (
    <GroupPanelItem
      name={panel.name}
      icon={icon}
      to={`/main/group/${groupId}/${panelId}`}
      extraBadge={extraBadge}
      nested={props.nested}
    />
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className="contents"
        render={<div className="contents">{panelItem}</div>}
      />
      <ContextMenuContent
        portalContainer={portalContainer}
        className="min-w-44"
      >
        {menuItems.map((item) =>
          item.type === 'divider' ? (
            <ContextMenuSeparator key={item.key} />
          ) : (
            <ContextMenuItem
              key={item.key}
              disabled={item.disabled}
              onClick={item.onClick}
            >
              {item.icon}
              {item.label}
            </ContextMenuItem>
          )
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});
SidebarItem.displayName = 'SidebarItem';
