import React from 'react';
import {
  ShieldCheckIcon,
  UserRoundMinusIcon,
  Volume2Icon,
  VolumeXIcon,
} from 'lucide-react';
import type { GroupMemberActionItem } from '@/hooks/useGroupMemberAction';
import {
  ContextMenuCheckboxItem,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/official/context-menu';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/official/dropdown-menu';

interface GroupMemberActionItemsProps {
  items: GroupMemberActionItem[];
  portalContainer: HTMLElement | null;
}

function getActionIcon(key: string) {
  switch (key) {
    case 'mute':
      return <VolumeXIcon />;
    case 'unmute':
      return <Volume2Icon />;
    case 'manageRole':
      return <ShieldCheckIcon />;
    case 'delete':
      return <UserRoundMinusIcon />;
    default:
      return null;
  }
}

export const GroupMemberDropdownItems: React.FC<GroupMemberActionItemsProps> =
  React.memo(({ items, portalContainer }) => (
    <>
      {items.map((item) => {
        const icon = getActionIcon(item.key);

        if (item.children?.length) {
          return (
            <DropdownMenuSub key={item.key}>
              <DropdownMenuSubTrigger disabled={item.disabled}>
                {icon}
                <span className="min-w-0 flex-1 text-left">{item.label}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent portalContainer={portalContainer}>
                <GroupMemberDropdownItems
                  items={item.children}
                  portalContainer={portalContainer}
                />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        }

        if (item.checked !== undefined) {
          return (
            <DropdownMenuCheckboxItem
              key={item.key}
              checked={item.checked}
              disabled={item.disabled}
              onCheckedChange={() => item.onClick?.()}
            >
              <span className="min-w-0 flex-1">{item.label}</span>
            </DropdownMenuCheckboxItem>
          );
        }

        return (
          <DropdownMenuItem
            key={item.key}
            disabled={item.disabled}
            variant={item.danger ? 'destructive' : 'default'}
            onClick={() => item.onClick?.()}
          >
            {icon}
            <span className="min-w-0 flex-1">{item.label}</span>
          </DropdownMenuItem>
        );
      })}
    </>
  ));
GroupMemberDropdownItems.displayName = 'GroupMemberDropdownItems';

export const GroupMemberContextMenuItems: React.FC<GroupMemberActionItemsProps> =
  React.memo(({ items, portalContainer }) => (
    <>
      {items.map((item) => {
        const icon = getActionIcon(item.key);

        if (item.children?.length) {
          return (
            <ContextMenuSub key={item.key}>
              <ContextMenuSubTrigger disabled={item.disabled}>
                {icon}
                <span className="min-w-0 flex-1 text-left">{item.label}</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent portalContainer={portalContainer}>
                <GroupMemberContextMenuItems
                  items={item.children}
                  portalContainer={portalContainer}
                />
              </ContextMenuSubContent>
            </ContextMenuSub>
          );
        }

        if (item.checked !== undefined) {
          return (
            <ContextMenuCheckboxItem
              key={item.key}
              checked={item.checked}
              disabled={item.disabled}
              onCheckedChange={() => item.onClick?.()}
            >
              <span className="min-w-0 flex-1">{item.label}</span>
            </ContextMenuCheckboxItem>
          );
        }

        return (
          <ContextMenuItem
            key={item.key}
            disabled={item.disabled}
            variant={item.danger ? 'destructive' : 'default'}
            onClick={() => item.onClick?.()}
          >
            {icon}
            <span className="min-w-0 flex-1">{item.label}</span>
          </ContextMenuItem>
        );
      })}
    </>
  ));
GroupMemberContextMenuItems.displayName = 'GroupMemberContextMenuItems';
