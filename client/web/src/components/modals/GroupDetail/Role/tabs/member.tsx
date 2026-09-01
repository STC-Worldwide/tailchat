import { closeModal, openModal } from '@/components/Modal';
import { SelectGroupMember } from '@/components/modals/SelectGroupMember';
import { UserListItem } from '@/components/UserListItem';
import React from 'react';
import {
  model,
  showErrorToasts,
  showSuccessToasts,
  t,
  useAsyncRequest,
  useGroupInfo,
  useMemoizedFn,
  useSearch,
  useUserInfoList,
} from 'tailchat-shared';
import _compact from 'lodash/compact';
import { Button } from '@/components/ui/official/button';
import { Input } from '@/components/ui/official/input';
import { PlusIcon, SearchIcon, UserMinusIcon } from 'lucide-react';

interface RoleMemberProps {
  groupId: string;
  currentRoleInfo: model.group.GroupRole;
}
export const RoleMember: React.FC<RoleMemberProps> = React.memo((props) => {
  const roleId = props.currentRoleInfo._id;
  const groupInfo = useGroupInfo(props.groupId);
  const members = (groupInfo?.members ?? []).filter((m) =>
    (m.roles ?? []).includes(roleId)
  );
  const memberIds = members.map((m) => m.userId);
  const userInfoList = useUserInfoList(memberIds);
  const {
    searchText,
    setSearchText,
    isSearching,
    searchResult: filterMembers,
  } = useSearch({
    dataSource: userInfoList,
    filterFn: (item, searchText) => String(item.nickname).includes(searchText),
  });

  const handleAddMember = useMemoizedFn(() => {
    const key = openModal(
      <SelectGroupMember
        groupId={props.groupId}
        withoutMemberIds={_compact([...memberIds])}
        onConfirm={async (selectedIds) => {
          try {
            await model.group.appendGroupMemberRoles(
              props.groupId,
              selectedIds,
              [props.currentRoleInfo._id]
            );
            showSuccessToasts();
            closeModal(key);
          } catch (err) {
            showErrorToasts(err);
          }
        }}
      />
    );
  });

  const [, handleRemoveMember] = useAsyncRequest(
    async (memberId: string) => {
      if (!props.currentRoleInfo?._id) {
        showErrorToasts(t('当前没有选择任何角色组'));
        return;
      }

      await model.group.removeGroupMemberRoles(
        props.groupId,
        [memberId],
        [props.currentRoleInfo._id]
      );
      showSuccessToasts();
    },
    [props.groupId, props.currentRoleInfo?._id]
  );

  return (
    <div className="space-y-4 py-2">
      {/* 管理成员 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button onClick={handleAddMember}>
          <PlusIcon />
          {t('添加成员')}
        </Button>

        {userInfoList.length > 0 && (
          <div className="relative w-64 max-w-full">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('搜索成员')}
              aria-label={t('搜索成员')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        {(isSearching ? filterMembers : userInfoList).map((m) => (
          <UserListItem
            key={m._id}
            userId={m._id}
            actions={[
              <Button
                key="remove"
                variant="destructive"
                size="icon-sm"
                aria-label={t('移除成员')}
                title={t('移除成员')}
                onClick={() => handleRemoveMember(m._id)}
              >
                <UserMinusIcon />
              </Button>,
            ]}
          />
        ))}
      </div>
    </div>
  );
});
RoleMember.displayName = 'RoleMember';
