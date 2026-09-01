import clsx from 'clsx';
import React from 'react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import {
  SidebarBadge,
  type SidebarBadgeProps,
} from '@/components/SidebarBadge';
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/official/sidebar';

/**
 * 群组面板项
 * 用于侧边栏
 */
export const GroupPanelItem: React.FC<{
  name: string;
  icon: React.ReactNode;
  to: string;
  dimmed?: boolean; // 颜色暗淡
  badge?: boolean;
  badgeProps?: SidebarBadgeProps;
  extraBadge?: React.ReactNode[];
  nested?: boolean;
}> = React.memo((props) => {
  const { icon, name, to, dimmed = false, badge, nested = false } = props;
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);
  const hasExtraBadge = Boolean(props.extraBadge?.some(Boolean));
  const showBadge = badge === true || hasExtraBadge;
  const badgeDot =
    typeof props.badgeProps?.count !== 'number' ||
    props.badgeProps.count <= 0;

  const content = (
    <>
      <span className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
        {icon}
      </span>
      <span>{name}</span>
      {nested && showBadge && (
        <span className="ml-auto flex items-center gap-1">
          {badge === true && (
            <SidebarBadge {...props.badgeProps} dot={badgeDot} />
          )}
          {props.extraBadge}
        </span>
      )}
    </>
  );

  if (nested) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          render={<Link to={to} />}
          isActive={isActive}
          className={clsx(
            'text-sidebar-foreground! no-underline data-active:bg-sidebar-accent! data-active:text-sidebar-accent-foreground!',
            dimmed && 'opacity-50'
          )}
        >
          {content}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link to={to} />}
        isActive={isActive}
        className={clsx(
          'text-sidebar-foreground! no-underline data-active:bg-sidebar-accent! data-active:text-sidebar-accent-foreground!',
          dimmed && 'opacity-50'
        )}
      >
        {content}
      </SidebarMenuButton>
      {showBadge && (
        <SidebarMenuBadge className="gap-1">
          {badge === true && (
            <SidebarBadge {...props.badgeProps} dot={badgeDot} />
          )}
          {props.extraBadge}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
});
GroupPanelItem.displayName = 'GroupPanelItem';
