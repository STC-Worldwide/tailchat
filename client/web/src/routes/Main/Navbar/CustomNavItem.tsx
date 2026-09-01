import type { PluginCustomPanel } from '@/plugin/common';
import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { NavbarNavItem } from './NavItem';

const defaultUseIsShow = () => true;

/**
 * 导航栏自定义选项
 * 用于插件
 */
export const NavbarCustomNavItem: React.FC<{
  panelInfo: PluginCustomPanel;
  /**
   * 是否包含背景
   */
  withBg: boolean;
}> = React.memo(({ panelInfo, withBg }) => {
  const useIsShow = useMemo(() => panelInfo.useIsShow ?? defaultUseIsShow, []);
  const isShow = useIsShow();

  if (!isShow) {
    return null;
  }

  return (
    <NavbarNavItem
      key={panelInfo.name}
      name={panelInfo.label}
      label={panelInfo.label}
      className={withBg ? undefined : 'text-muted-foreground'}
      to={`/main/custom/${panelInfo.name}`}
      data-testid={`navbar-custom-${panelInfo.name}`}
    >
      <Icon icon={panelInfo.icon} />
    </NavbarNavItem>
  );
});
NavbarCustomNavItem.displayName = 'NavbarCustomNavItem';
