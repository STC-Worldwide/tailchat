import { canInstallprompt, showInstallPrompt } from '@/utils/sw-helper';
import React, { useEffect, useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { t } from 'tailchat-shared';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/official/sidebar';

/**
 * 安装按钮
 */
export const InstallBtn: React.FC = React.memo(() => {
  const canInstall = useCanInstallPwa();

  if (!canInstall) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={t('安装应用')} onClick={showInstallPrompt}>
        <DownloadIcon />
        <span>{t('安装应用')}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});
InstallBtn.displayName = 'InstallBtn';

function useCanInstallPwa() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (canInstallprompt()) {
      setCanInstall(true);
      return;
    }

    const handleEvent = (e: any) => {
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleEvent);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleEvent);
    };
  }, []);

  return canInstall;
}
