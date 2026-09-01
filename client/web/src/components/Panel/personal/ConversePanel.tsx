import { ChatBox } from '@/components/ChatBox';
import { UserListItem } from '@/components/UserListItem';
import React from 'react';
import {
  ChatConverseState,
  t,
  useAppSelector,
  useDMConverseName,
  useUserId,
  useUserInfoList,
} from 'tailchat-shared';
import { CommonPanelWrapper } from '../common/Wrapper';
import _compact from 'lodash/compact';
import { openModal } from '@/components/Modal';
import { AppendDMConverseMembers } from '@/components/modals/AppendDMConverseMembers';
import { usePanelWindow } from '@/hooks/usePanelWindow';
import { OpenedPanelTip } from '@/components/OpenedPanelTip';
import { DMPluginPanelActionProps, pluginPanelActions } from '@/plugin/common';
import { CreateDMConverse } from '@/components/modals/CreateDMConverse';
import { MessageSearchPanel } from '../common/MessageSearch';
import { ChatInputMentionsContextProvider } from '@/components/ChatBox/ChatInputBox/context';
import {
  PanelActionButton,
  PluginPanelActionIcon,
} from '../common/PanelActionButton';
import {
  PanelTopOpenIcon,
  SearchIcon,
  UserRoundPlusIcon,
  UsersIcon,
} from 'lucide-react';

const ConversePanelTitle: React.FC<{ converse: ChatConverseState }> =
  React.memo(({ converse }) => {
    const name = useDMConverseName(converse);

    return t('与 {{name}} 的会话', { name });
  });
ConversePanelTitle.displayName = 'ConversePanelTitle';

const ConversePanelMembers: React.FC<{ members: string[] }> = React.memo(
  ({ members }) => {
    return (
      <div className="p-2">
        {members.map((member) => (
          <UserListItem key={member} userId={member} />
        ))}
      </div>
    );
  }
);
ConversePanelMembers.displayName = 'ConversePanelMembers';

interface ConversePanelProps {
  converseId: string;
}
export const ConversePanel: React.FC<ConversePanelProps> = React.memo(
  ({ converseId }) => {
    const converse = useAppSelector(
      (state) => state.chat.converses[converseId]
    );
    const userId = useUserId();
    const userInfos = useUserInfoList(
      (converse?.members ?? []).filter((m) => m !== userId)
    );

    const { hasOpenedPanel, openPanelWindow, closePanelWindow } =
      usePanelWindow(`/panel/personal/converse/${converseId}`);
    if (hasOpenedPanel) {
      return <OpenedPanelTip onClosePanelWindow={closePanelWindow} />;
    }

    const converseHeader = converse && (
      <ConversePanelTitle converse={converse} />
    );

    return (
      <CommonPanelWrapper
        header={converseHeader}
        actions={({ setRightPanel }) => {
          if (!converse) {
            return [];
          }

          return _compact([
            ...pluginPanelActions
              .filter(
                (action): action is DMPluginPanelActionProps =>
                  action.position === 'dm'
              )
              .map((action) => (
                <PanelActionButton
                  key={action.name}
                  label={action.label}
                  icon={<PluginPanelActionIcon icon={action.icon} />}
                  onClick={() => action.onClick({ converseId })}
                />
              )),
            <PanelActionButton
              key="open"
              label={t('在新窗口打开')}
              icon={<PanelTopOpenIcon />}
              onClick={openPanelWindow}
            />,
            converse.members.length === 2 ? (
              <PanelActionButton
                key="create"
                label={t('创建会话')}
                icon={<UserRoundPlusIcon />}
                onClick={() =>
                  openModal(
                    <CreateDMConverse hiddenUserIds={converse.members} />,
                    { closable: true }
                  )
                }
              />
            ) : (
              <PanelActionButton
                key="add"
                label={t('邀请成员')}
                icon={<UserRoundPlusIcon />}
                onClick={() =>
                  openModal(
                    <AppendDMConverseMembers
                      converseId={converse._id}
                      withoutUserIds={converse.members}
                    />,
                    { closable: true }
                  )
                }
              />
            ),
            <PanelActionButton
              key="search"
              label={t('聊天记录搜索')}
              icon={<SearchIcon />}
              onClick={() =>
                setRightPanel({
                  name: t('聊天记录'),
                  panel: <MessageSearchPanel converseId={converseId} />,
                })
              }
            />,
            // 当成员数大于2时，显示成员列表按钮
            converse.members.length > 2 && (
              <PanelActionButton
                key="members"
                label={t('成员列表')}
                icon={<UsersIcon />}
                onClick={() =>
                  setRightPanel({
                    name: t('成员') + ` (${converse.members.length})`,
                    panel: <ConversePanelMembers members={converse.members} />,
                  })
                }
              />
            ),
          ]);
        }}
      >
        <ChatInputMentionsContextProvider
          users={userInfos.map((m) => ({
            id: m._id,
            display: m.nickname,
          }))}
        >
          <ChatBox
            converseId={converseId}
            converseTitle={converseHeader}
            isGroup={false}
          />
        </ChatInputMentionsContextProvider>
      </CommonPanelWrapper>
    );
  }
);
ConversePanel.displayName = 'ConversePanel';
