import React, { PropsWithChildren, useState } from 'react';
import clsx from 'clsx';
import { ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/official/button';
import { SidebarHeader } from '@/components/ui/official/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/official/dropdown-menu';
import { useAppPortalContainer } from '@/hooks/useAppPortalContainer';

export interface SectionHeaderMenuItem {
  key: React.Key;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export interface SectionHeaderMenu {
  items?: (SectionHeaderMenuItem | false | null)[];
}

interface SectionHeaderProps extends PropsWithChildren {
  menu?: SectionHeaderMenu;
  'data-testid'?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(
  (props) => {
    const [visible, setVisible] = useState(false);
    const portalContainer = useAppPortalContainer();
    const menuItems = (props.menu?.items ?? []).filter(
      Boolean
    ) as SectionHeaderMenuItem[];

    return (
      <SidebarHeader className="relative flex h-14 flex-shrink-0 justify-center border-b border-border px-2 py-2 text-sm font-semibold">
        {props.menu ? (
          <DropdownMenu onOpenChange={setVisible}>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-full flex-1 justify-start px-2 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  data-testid={props['data-testid']}
                >
                  <span className="flex-1 truncate">{props.children}</span>
                  <ChevronDownIcon
                    className={clsx('size-4 shrink-0 transition-transform', {
                      'rotate-180': visible,
                    })}
                  />
                </Button>
              }
            />
            <DropdownMenuContent
              portalContainer={portalContainer}
              side="bottom"
              align="end"
              sideOffset={6}
              className="min-w-40"
            >
              {menuItems.map((item) => (
                <DropdownMenuItem
                  key={item.key}
                  disabled={item.disabled}
                  variant={item.danger ? 'destructive' : 'default'}
                  onClick={item.onClick}
                >
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <header
            className="flex-1 truncate px-2 select-text"
            data-testid={props['data-testid']}
          >
            {props.children}
          </header>
        )}
      </SidebarHeader>
    );
  }
);
SectionHeader.displayName = 'SectionHeader';
