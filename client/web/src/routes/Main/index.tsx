import { GlobalAnnouncementBar } from '@/components/GlobalAnnouncementBar';
import { GlobalTemporaryTip } from '@/components/GlobalTemporaryTip';
import { useRecordMeasure } from '@/utils/measure-helper';
import React from 'react';
import { localTrans, useMessageNotifyEventFilter } from 'tailchat-shared';
import { MainContent } from './Content';
import { Navbar } from './Navbar';
import { MainProvider } from './Provider';
import { useShortcuts } from './useShortcuts';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/official/sidebar';
import { MobileMenuBtn } from './Navbar/MobileMenuBtn';
import { Separator } from '@/components/ui/official/separator';
import { AppShellHeader } from './AppShellHeader';

const MainRoute: React.FC = React.memo(() => {
  useRecordMeasure('appMainRenderStart');
  useShortcuts();
  useMessageNotifyEventFilter();

  return (
    <MainProvider>
      <SidebarProvider
        defaultOpen={true}
        className="h-full min-h-0"
        style={
          {
            '--sidebar-width': '15rem',
            '--sidebar-width-icon': '3rem',
          } as React.CSSProperties
        }
      >
        <Navbar />

        <SidebarInset className="h-full min-h-0 overflow-hidden border border-border/70 shadow-sm md:h-[calc(100%-1rem)]">
          <GlobalTemporaryTip />
          <GlobalAnnouncementBar />

          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/70 bg-background px-3">
            <SidebarTrigger
              label={localTrans({
                'zh-CN': '切换应用导航',
                'en-US': 'Toggle app navigation',
              })}
            />
            <Separator orientation="vertical" className="h-4" />
            <AppShellHeader />
            <div className="ml-auto md:hidden">
              <MobileMenuBtn />
            </div>
          </header>

          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
            <MainContent />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </MainProvider>
  );
});
MainRoute.displayName = 'MainRoute';

export default MainRoute;
