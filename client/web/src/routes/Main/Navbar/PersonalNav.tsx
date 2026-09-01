import React from 'react';
import {
  t,
  useDMConverseList,
  useUnread,
  useAppSelector,
  localTrans,
} from 'tailchat-shared';
import { NavbarNavItem } from './NavItem';
import { UserRoundIcon } from 'lucide-react';

function usePersonalUnread(): boolean {
  const converse = useDMConverseList();
  const unreads = useUnread(converse.map((converse) => String(converse._id)));

  return unreads.some((u) => u === true);
}

export const PersonalNav: React.FC = React.memo(() => {
  const unread = usePersonalUnread();
  const hasFriendRequest = useAppSelector(
    (state) =>
      state.user.friendRequests.findIndex(
        (item) => item.to === state.user.info?._id
      ) >= 0
  );

  const badge = unread || hasFriendRequest;

  return (
    <NavbarNavItem
      name={localTrans({ 'zh-CN': '个人', 'en-US': 'Personal' })}
      label={localTrans({ 'zh-CN': '个人', 'en-US': 'Personal' })}
      to={'/main/personal'}
      showPill={true}
      badge={badge}
      data-testid="navbar-personal"
    >
      <UserRoundIcon />
    </NavbarNavItem>
  );
});
PersonalNav.displayName = 'PersonalNav';
