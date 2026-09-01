import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { createDMConverse, localTrans, useAsyncRequest } from 'tailchat-shared';
import { FriendPicker } from '../UserPicker/FriendPicker';
import { closeModal, ModalWrapper } from '../Modal';
import { Button } from '@/components/ui/official/button';
import { LoaderCircleIcon, MessagesSquareIcon } from 'lucide-react';

interface CreateDMConverseProps {
  /**
   * 隐藏成员
   * 在选择好友时会进行过滤
   * 但是创建时会加上
   */
  hiddenUserIds?: string[];
}
export const CreateDMConverse: React.FC<CreateDMConverseProps> = React.memo(
  (props) => {
    const { hiddenUserIds = [] } = props;
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const navigate = useNavigate();

    const [{ loading }, handleCreate] = useAsyncRequest(async () => {
      const converse = await createDMConverse([
        ...hiddenUserIds,
        ...selectedFriendIds,
      ]);
      closeModal();
      navigate(`/main/personal/converse/${converse._id}`);
    }, [selectedFriendIds]);

    return (
      <ModalWrapper
        className="w-[min(26rem,calc(100vw-2rem))]"
        style={{ maxWidth: 416 }}
        title={localTrans({
          'zh-CN': '创建群聊',
          'en-US': 'Create group chat',
        })}
      >
        <FriendPicker
          withoutUserIds={hiddenUserIds}
          selectedIds={selectedFriendIds}
          onChange={setSelectedFriendIds}
          emptyTitle={localTrans({
            'zh-CN': '没有可选择的好友',
            'en-US': 'No friends available',
          })}
          emptyDescription={localTrans({
            'zh-CN': '请先添加好友，然后返回这里创建群聊。',
            'en-US':
              'Add friends first, then return here to start a group chat.',
          })}
        />

        <div className="mt-4 flex justify-end border-t border-border/70 pt-4">
          <Button
            disabled={loading || selectedFriendIds.length === 0}
            aria-busy={loading}
            onClick={handleCreate}
          >
            {loading ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <MessagesSquareIcon data-icon="inline-start" />
            )}
            {loading
              ? localTrans({ 'zh-CN': '正在创建', 'en-US': 'Creating' })
              : localTrans({
                  'zh-CN': '创建群聊',
                  'en-US': 'Create group chat',
                })}
          </Button>
        </div>
      </ModalWrapper>
    );
  }
);
CreateDMConverse.displayName = 'CreateDMConverse';
