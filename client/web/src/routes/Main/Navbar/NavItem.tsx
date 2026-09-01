import type { ClassValue } from 'clsx';
import clsx from 'clsx';
import React, { PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useEvent } from 'tailchat-shared';
import {
  SidebarBadge,
  type SidebarBadgeProps,
} from '@/components/SidebarBadge';
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/official/sidebar';

export const NavbarNavItem: React.FC<
  PropsWithChildren<{
    name: string;
    label?: React.ReactNode;
    className?: ClassValue;
    to?: string;
    showPill?: boolean;
    badge?: boolean;
    badgeProps?: SidebarBadgeProps;
    onClick?: () => void;
    ['data-testid']?: string;
  }>
> = React.memo((props) => {
  const {
    name,
    label,
    className,
    to,
    badge = false,
  } = props;
  const location = useLocation();
  const isActive = typeof to === 'string' && location.pathname.startsWith(to);
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleClick = useEvent(() => {
    if (typeof to === 'string') {
      navigate(to);
    }
    props.onClick?.();
    if (isMobile) {
      setOpenMobile(false);
    }
  });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        tooltip={name}
        isActive={isActive}
        className={clsx('h-10 rounded-lg', className)}
        onClick={handleClick}
        data-testid={props['data-testid']}
      >
        <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md [&>svg]:size-4">
          {props.children}
        </span>
        <span>{label ?? name}</span>
      </SidebarMenuButton>

      {badge && (
        <SidebarMenuBadge>
          <SidebarBadge
            {...props.badgeProps}
            dot={props.badgeProps?.count === undefined}
          />
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
});
NavbarNavItem.displayName = 'NavbarNavItem';
