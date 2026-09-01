import React from 'react';
import { t, useInboxList } from 'tailchat-shared';
import { NavbarNavItem } from './NavItem';
import { InboxIcon } from 'lucide-react';

/**
 * 收件箱
 */
export const InboxNav: React.FC = React.memo(() => {
  const inbox = useInboxList();
  const unreadList = inbox.filter((i) => !i.readed);

  return (
    <NavbarNavItem
      name={t('收件箱')}
      label={t('收件箱')}
      to={'/main/inbox'}
      showPill={true}
      badge={unreadList.length > 0}
      badgeProps={{
        count: unreadList.length,
      }}
      data-testid="inbox"
    >
      <InboxIcon />
    </NavbarNavItem>
  );
});
InboxNav.displayName = 'InboxNav';
