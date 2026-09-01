import { closeModal, openModal } from '@/components/Modal';
import { SettingsView } from '@/components/modals/SettingsView';
import React, { useCallback } from 'react';
import { SettingsIcon } from 'lucide-react';
import { t, useUserInfo } from 'tailchat-shared';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/official/sidebar';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/official/avatar';

export const SettingBtn: React.FC = React.memo(() => {
  const userInfo = useUserInfo();
  const { isMobile, setOpenMobile } = useSidebar();
  const handleClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
    const key = openModal(<SettingsView onClose={() => closeModal(key)} />);
  }, [isMobile, setOpenMobile]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        tooltip={t('系统设置')}
        onClick={handleClick}
        className="h-12"
      >
        <Avatar size="sm" className="rounded-md after:rounded-md">
          <AvatarImage
            src={userInfo?.avatar || undefined}
            alt={userInfo?.nickname ?? ''}
            className="rounded-md"
          />
          <AvatarFallback className="rounded-md font-medium">
            {userInfo?.nickname?.slice(0, 1).toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
          <span className="block truncate text-sm font-medium">
            {userInfo?.nickname ?? t('系统设置')}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {t('系统设置')}
          </span>
        </span>
        <SettingsIcon className="ml-auto group-data-[collapsible=icon]:hidden" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});
SettingBtn.displayName = 'SettingBtn';
