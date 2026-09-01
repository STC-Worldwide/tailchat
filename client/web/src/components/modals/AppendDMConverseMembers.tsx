import React, { useState } from 'react';
import {
  appendDMConverseMembers,
  localTrans,
  useAsyncFn,
} from 'tailchat-shared';
import { FriendPicker } from '../UserPicker/FriendPicker';
import { closeModal, ModalWrapper } from '../Modal';
import { Button } from '@/components/ui/official/button';
import { LoaderCircleIcon, UserPlusIcon } from 'lucide-react';

interface AppendDMConverseMembersProps {
  converseId: string;
  /**
   * 排除的用户id
   * 在选择好友时会进行过滤
   */
  withoutUserIds?: string[];
}
export const AppendDMConverseMembers: React.FC<AppendDMConverseMembersProps> =
  React.memo((props) => {
    const { converseId, withoutUserIds = [] } = props;
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

    const [{ loading }, handleConfirm] = useAsyncFn(async () => {
      await appendDMConverseMembers(converseId, [...selectedFriendIds]);
      closeModal();
    }, [converseId, selectedFriendIds]);

    return (
      <ModalWrapper
        className="w-[min(26rem,calc(100vw-2rem))]"
        style={{ maxWidth: 416 }}
        title={localTrans({
          'zh-CN': '邀请好友加入会话',
          'en-US': 'Invite friends to the conversation',
        })}
      >
        <FriendPicker
          withoutUserIds={withoutUserIds}
          selectedIds={selectedFriendIds}
          onChange={setSelectedFriendIds}
          emptyTitle={localTrans({
            'zh-CN': '没有可邀请的好友',
            'en-US': 'No friends to invite',
          })}
          emptyDescription={localTrans({
            'zh-CN': '所有符合条件的好友都已加入，或者你的好友列表为空。',
            'en-US':
              'All eligible friends are already members, or your friends list is empty.',
          })}
        />

        <div className="mt-4 flex justify-end border-t border-border/70 pt-4">
          <Button
            disabled={loading || selectedFriendIds.length === 0}
            aria-busy={loading}
            onClick={handleConfirm}
          >
            {loading ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <UserPlusIcon data-icon="inline-start" />
            )}
            {loading
              ? localTrans({ 'zh-CN': '正在邀请', 'en-US': 'Inviting' })
              : localTrans({
                  'zh-CN': '邀请所选好友',
                  'en-US': 'Invite selected friends',
                })}
          </Button>
        </div>
      </ModalWrapper>
    );
  });
AppendDMConverseMembers.displayName = 'AppendDMConverseMembers';
