import React from 'react';
import { GroupNav } from './GroupNav';
import { SettingBtn } from './SettingBtn';
import { PersonalNav } from './PersonalNav';
import { InboxNav } from './InboxNav';
import { InstallBtn } from './InstallBtn';
import { pluginCustomPanel } from '@/plugin/common';
import { NavbarCustomNavItem } from './CustomNavItem';
import { QuickSwitcherNav } from './QuickSwitcherNav';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/official/sidebar';
import { localTrans, t } from 'tailchat-shared';
import { MessageSquareMoreIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * 导航栏组件
 */
export const Navbar: React.FC = React.memo(() => {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar
      data-tc-role="navbar"
      variant="inset"
      collapsible="icon"
      mobileTitle={localTrans({
        'zh-CN': '应用导航',
        'en-US': 'App navigation',
      })}
      mobileDescription={localTrans({
        'zh-CN': '浏览个人空间、收件箱和群组',
        'en-US': 'Browse personal spaces, inbox, and groups',
      })}
      mobileCloseLabel={t('关闭')}
      className="bg-sidebar"
    >
      <SidebarHeader className="p-2 pb-1 pr-11 md:pr-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link
                  to="/main/personal"
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                />
              }
              size="lg"
              tooltip="Tailchat"
              className="h-10"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <MessageSquareMoreIcon className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                Tailchat
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>
            {localTrans({ 'zh-CN': '导航', 'en-US': 'Navigation' })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <PersonalNav />
              <InboxNav />
              <QuickSwitcherNav />

              {pluginCustomPanel
                .filter((p) => p.position === 'navbar-personal')
                .map((p) => (
                  <NavbarCustomNavItem
                    key={p.name}
                    panelInfo={p}
                    withBg={true}
                  />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup className="min-h-0 flex-1">
          <SidebarGroupLabel>
            {localTrans({ 'zh-CN': '群组', 'en-US': 'Groups' })}
          </SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 overflow-y-auto thin-scrollbar">
            <GroupNav />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter data-tc-role="navbar-settings" className="p-2 pt-1">
        {/* React Query's floating flower control is intentionally kept out of
            the product navigation. It remains available to developers through
            React Query tooling without reintroducing legacy sidebar chrome. */}
        <SidebarMenu>
          {pluginCustomPanel
            .filter((p) => p.position === 'navbar-more')
            .map((p) => (
              <NavbarCustomNavItem key={p.name} panelInfo={p} withBg={false} />
            ))}

          <InstallBtn />
          <SettingBtn />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail
        label={localTrans({
          'zh-CN': '切换应用导航',
          'en-US': 'Toggle app navigation',
        })}
      />
    </Sidebar>
  );
});
Navbar.displayName = 'Navbar';
