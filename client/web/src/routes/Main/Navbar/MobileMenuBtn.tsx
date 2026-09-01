import { useIsMobile } from '@/hooks/useIsMobile';
import React from 'react';
import { useSidebarContext } from '../SidebarContext';
import { Button } from '@/components/ui/official/button';
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import { localTrans } from 'tailchat-shared';

export const MobileMenuBtn: React.FC = React.memo(() => {
  const { showSidebar, switchSidebar } = useSidebarContext();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={localTrans({
        'zh-CN': showSidebar ? '关闭频道导航' : '打开频道导航',
        'en-US': showSidebar
          ? 'Close channel navigation'
          : 'Open channel navigation',
      })}
      aria-expanded={showSidebar}
      onClick={switchSidebar}
    >
      {showSidebar ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
    </Button>
  );
});
MobileMenuBtn.displayName = 'MobileMenuBtn';
