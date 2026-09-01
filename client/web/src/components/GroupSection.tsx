import React, { PropsWithChildren } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/official/collapsible';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/official/sidebar';

export const GroupSection: React.FC<
  PropsWithChildren<{
    header: string;
  }>
> = React.memo((props) => {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger render={<SidebarMenuButton />}>
          <ChevronRightIcon className="transition-transform group-data-open/collapsible:rotate-90" />
          <span>{props.header}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>{props.children}</SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
});
GroupSection.displayName = 'GroupSection';
