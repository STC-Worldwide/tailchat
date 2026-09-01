import React, { PropsWithChildren } from 'react';
import { Sidebar } from '@/components/ui/official/sidebar';

interface CommonSidebarProps extends PropsWithChildren {
  ['data-tc-role']?: string;
}
export const CommonSidebarWrapper: React.FC<CommonSidebarProps> = React.memo(
  (props) => {
    return (
      <Sidebar
        collapsible="none"
        data-slot="context-sidebar"
        className="h-full min-h-0 w-full min-w-0 border-0 bg-sidebar/35 text-sidebar-foreground"
        data-tc-role={props['data-tc-role']}
      >
        {props.children}
      </Sidebar>
    );
  }
);
CommonSidebarWrapper.displayName = 'CommonSidebarWrapper';
