import React from 'react';
import { NavbarNavItem } from './NavItem';
import { localTrans, t } from 'tailchat-shared';
import { openQuickSwitcher } from '@/components/QuickSwitcher';
import { SearchIcon } from 'lucide-react';

export const QuickSwitcherNav: React.FC = React.memo(() => {
  return (
    <NavbarNavItem
      name={t('快速搜索、跳转') + ' | ctrl + k'}
      label={localTrans({ 'zh-CN': '搜索', 'en-US': 'Search' })}
      onClick={() => {
        openQuickSwitcher();
      }}
      data-testid="search"
    >
      <SearchIcon />
    </NavbarNavItem>
  );
});
QuickSwitcherNav.displayName = 'QuickSwitcherNav';
