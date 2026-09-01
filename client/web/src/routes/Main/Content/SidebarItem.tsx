import React from 'react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { SidebarBadge } from '@/components/SidebarBadge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';
import {
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/official/sidebar';

interface SidebarItemProps {
  name: string;
  to: string;
  badge?: boolean | number;
  icon?: string | React.ReactElement;
  action?: {
    icon: React.ReactNode;
    label: string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
  };
}
export const SidebarItem: React.FC<SidebarItemProps> = React.memo((props) => {
  const { icon, name, to, badge } = props;
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link to={to} />}
        isActive={isActive}
        aria-current={isActive ? 'page' : undefined}
        size="lg"
        className="h-10 rounded-lg text-sidebar-foreground! no-underline data-active:bg-sidebar-accent! data-active:text-sidebar-accent-foreground!"
      >
        <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md [&>svg]:size-4">
          {React.isValidElement(icon) ? (
            icon
          ) : (
            <Avatar size="sm" className="rounded-md after:rounded-md">
              <AvatarImage
                src={typeof icon === 'string' ? icon : undefined}
                alt={name}
                className="rounded-md"
              />
              <AvatarFallback className="rounded-md font-medium">
                {name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </span>

        <span>{name}</span>
      </SidebarMenuButton>

      {badge && (
        <SidebarMenuBadge>
          {badge === true ? (
            <SidebarBadge dot={true} />
          ) : (
            <SidebarBadge count={badge} />
          )}
        </SidebarMenuBadge>
      )}

      {props.action && (
        <SidebarMenuAction
          showOnHover
          aria-label={props.action.label}
          onClick={props.action.onClick}
        >
          {props.action.icon}
        </SidebarMenuAction>
      )}
    </SidebarMenuItem>
  );
});
SidebarItem.displayName = 'SidebarItem';
