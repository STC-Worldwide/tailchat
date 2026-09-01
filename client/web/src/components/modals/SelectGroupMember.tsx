import React, { useMemo, useState } from 'react';
import { t, useAsyncFn, useGroupMemberIds } from 'tailchat-shared';
import { ModalWrapper } from '../Modal';
import { UserPicker } from '../UserPicker/UserPicker';
import _without from 'lodash/without';
import { Button } from '@/components/ui/official/button';
import { LoaderCircleIcon } from 'lucide-react';

interface SelectGroupMemberProps {
  /**
   * 群组id
   */
  groupId: string;
  /**
   * 排除的用户id
   * 在选择好友时会进行过滤
   */
  withoutMemberIds?: string[];

  /**
   * 点击确认按钮的回调
   */
  onConfirm: (selectedUserIds: string[]) => void | Promise<void>;
}

/**
 * 选择群组成员
 */
export const SelectGroupMember: React.FC<SelectGroupMemberProps> = React.memo(
  (props) => {
    const { groupId, withoutMemberIds = [], onConfirm } = props;
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const groupMemberIds = useGroupMemberIds(groupId);
    const filterMemberIds = useMemo(
      () => _without(groupMemberIds, ...withoutMemberIds),
      [groupMemberIds, withoutMemberIds]
    );

    const [{ loading }, handleConfirm] = useAsyncFn(async () => {
      await onConfirm(selectedUserIds);
    }, [onConfirm, selectedUserIds]);

    return (
      <ModalWrapper title={t('选择群组成员')}>
        <UserPicker
          allUserIds={filterMemberIds}
          selectedIds={selectedUserIds}
          onChange={setSelectedUserIds}
        />

        <div className="text-right">
          <Button
            type="button"
            disabled={loading}
            aria-busy={loading}
            onClick={handleConfirm}
          >
            {loading && <LoaderCircleIcon className="animate-spin" />}
            {t('确认')}
          </Button>
        </div>
      </ModalWrapper>
    );
  }
);
SelectGroupMember.displayName = 'SelectGroupMember';
