import React from 'react';
import { SidebarItem } from '../SidebarItem';
import {
  localTrans,
  t,
  useDMConverseList,
  useUserInfo,
  useGlobalConfigStore,
  useAppSelector,
} from 'tailchat-shared';
import { SidebarDMItem } from './SidebarDMItem';
import { openModal } from '@/components/Modal';
import { CreateDMConverse } from '@/components/modals/CreateDMConverse';
import { SectionHeader } from '@/components/SectionHeader';
import { CommonSidebarWrapper } from '@/components/CommonSidebarWrapper';
import { pluginCustomPanel } from '@/plugin/common';
import { CustomSidebarItem } from '../CustomSidebarItem';
import { PuzzleIcon, UserRoundPlusIcon, UsersIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarContent,
} from '@/components/ui/official/sidebar';

/**
 * 个人面板侧边栏组件
 */
export const PersonalSidebar: React.FC = React.memo(() => {
  const converseList = useDMConverseList();
  const userInfo = useUserInfo();
  const disablePluginStore = useGlobalConfigStore(
    (state) => state.disablePluginStore
  );
  const hasFriendRequest = useAppSelector(
    (state) =>
      state.user.friendRequests.findIndex(
        (item) => item.to === state.user.info?._id
      ) >= 0
  );

  return (
    <CommonSidebarWrapper data-tc-role="sidebar-personal">
      <SectionHeader>{userInfo?.nickname}</SectionHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarItem
                name={t('好友')}
                icon={<UsersIcon />}
                to="/main/personal/friends"
                badge={hasFriendRequest}
              />

              {!disablePluginStore && (
                <SidebarItem
                  name={t('插件中心')}
                  icon={<PuzzleIcon />}
                  to="/main/personal/plugins"
                />
              )}

              {pluginCustomPanel
                .filter((p) => p.position === 'personal')
                .map((p) => (
                  <CustomSidebarItem key={p.name} panelInfo={p} />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('私信')}</SidebarGroupLabel>
          <SidebarGroupAction
            aria-label={localTrans({
              'zh-CN': '创建群聊',
              'en-US': 'Create group chat',
            })}
            onClick={() => openModal(<CreateDMConverse />, { closable: true })}
          >
            <UserRoundPlusIcon />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {converseList.map((converse) => (
                <SidebarDMItem key={converse._id} converse={converse} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </CommonSidebarWrapper>
  );
});
PersonalSidebar.displayName = 'PersonalSidebar';
