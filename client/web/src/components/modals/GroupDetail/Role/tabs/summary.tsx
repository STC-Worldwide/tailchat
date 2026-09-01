import {
  DefaultFullModalInputEditorRender,
  FullModalField,
} from '@/components/FullModal/Field';
import { openReconfirmModal } from '@/components/Modal';
import React from 'react';
import { model, t, useMemoizedFn } from 'tailchat-shared';
import { Button } from '@/components/ui/official/button';
import { Trash2Icon } from 'lucide-react';
import { GroupDetailFieldGroup } from '../../Layout';

interface RoleSummaryProps {
  currentRoleInfo: model.group.GroupRole;
  onChangeRoleName: (roleName: string) => void;
  onDeleteRole: () => Promise<void>;
}
// 权限概述
export const RoleSummary: React.FC<RoleSummaryProps> = React.memo((props) => {
  const { currentRoleInfo } = props;

  const handleDeleteRole = useMemoizedFn(() => {
    openReconfirmModal({
      title: t('确认要删除角色 {{name}} 么?', {
        name: currentRoleInfo.name,
      }),
      onConfirm: () => props.onDeleteRole(),
    });
  });

  return (
    <div className="space-y-5 py-2">
      <GroupDetailFieldGroup className="[&>[data-slot=field]]:mb-0 [&>[data-slot=field]]:px-4 [&>[data-slot=field]]:py-3.5">
        <FullModalField
          title={t('身份组名称')}
          value={props.currentRoleInfo.name}
          editable={true}
          renderEditor={DefaultFullModalInputEditorRender}
          onSave={props.onChangeRoleName}
        />
      </GroupDetailFieldGroup>

      <Button variant="destructive" onClick={handleDeleteRole}>
        <Trash2Icon />
        {t('删除身份组')}
      </Button>
    </div>
  );
});
RoleSummary.displayName = 'RoleSummary';
