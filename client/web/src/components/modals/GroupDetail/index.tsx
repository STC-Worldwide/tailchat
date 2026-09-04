import { FullModal } from '@/components/FullModal';
import {
  SidebarView,
  SidebarViewMenuItem,
  SidebarViewMenuType,
} from '@/components/SidebarView';
import { GroupIdContextProvider } from '@/context/GroupIdContext';
import { pluginCustomPanel } from '@/plugin/common';
import React, { useCallback, useMemo } from 'react';
import { PERMISSION, t, useHasGroupPermission } from 'tailchat-shared';
import { GroupInvite } from './Invite';
import { GroupRole } from './Role';
import { GroupSummary } from './Summary';
import _compact from 'lodash/compact';
import { GroupConfig } from './Config';
import { GroupMember } from './Member';
import {
  LayoutDashboardIcon,
  PuzzleIcon,
  Settings2Icon,
  ShieldCheckIcon,
  TicketIcon,
  UsersIcon,
} from 'lucide-react';

interface SettingsViewProps {
  groupId: string;
  onClose: () => void;
}
export const GroupDetail: React.FC<SettingsViewProps> = React.memo((props) => {
  const groupId = props.groupId;
  const handleChangeVisible = useCallback(
    (visible: boolean) => {
      if (visible === false && typeof props.onClose === 'function') {
        props.onClose();
      }
    },
    [props.onClose]
  );
  const [
    allowManageConfig,
    allowManageUser,
    allowManageInvite,
    allowManageRoles,
  ] = useHasGroupPermission(groupId, [
    PERMISSION.core.groupConfig,
    PERMISSION.core.manageUser,
    PERMISSION.core.manageInvite,
    PERMISSION.core.manageRoles,
  ]);

  const menu: SidebarViewMenuType[] = useMemo(() => {
    // 内置
    const _menu: SidebarViewMenuType[] = [
      {
        type: 'group',
        title: t('通用'),
        children: _compact([
          {
            type: 'item',
            title: t('概述'),
            icon: <LayoutDashboardIcon />,
            content: <GroupSummary groupId={groupId} />,
          },
          allowManageConfig && {
            type: 'item',
            title: t('配置'),
            icon: <Settings2Icon />,
            content: <GroupConfig groupId={groupId} />,
          },
          allowManageUser && {
            type: 'item',
            title: t('成员'),
            icon: <UsersIcon />,
            content: <GroupMember groupId={groupId} />,
          },
          allowManageInvite && {
            type: 'item',
            title: t('邀请码'),
            icon: <TicketIcon />,
            content: <GroupInvite groupId={groupId} />,
          },
          allowManageRoles && {
            type: 'item',
            title: t('身份组'),
            icon: <ShieldCheckIcon />,
            content: <GroupRole groupId={groupId} />,
          },
        ]),
      },
    ];

    // 插件
    const _pluginMenu: SidebarViewMenuItem[] = pluginCustomPanel
      .filter((p) => p.position === 'groupdetail')
      .map((p) => ({
        type: 'item',
        title: p.label,
        icon: <PuzzleIcon />,
        content: React.createElement(p.render),
      }));

    if (_pluginMenu.length > 0) {
      _menu.push({
        type: 'group',
        title: t('插件'),
        children: _pluginMenu,
      });
    }

    return _menu;
  }, [
    allowManageConfig,
    allowManageInvite,
    allowManageRoles,
    allowManageUser,
    groupId,
  ]);

  return (
    <GroupIdContextProvider value={groupId}>
      <FullModal onChangeVisible={handleChangeVisible}>
        <SidebarView menu={menu} defaultContentPath="0.children.0.content" />
      </FullModal>
    </GroupIdContextProvider>
  );
});
GroupDetail.displayName = 'GroupDetail';
