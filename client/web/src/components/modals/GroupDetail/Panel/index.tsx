import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  useGroupInfo,
  GroupPanel as GroupPanelInfo,
  t,
  modifyGroupField,
  useAsyncRequest,
  showToasts,
} from 'tailchat-shared';
import _isEqual from 'lodash/isEqual';
import { GroupPanelTree } from './GroupPanelTree';
import { closeModal, openModal } from '@/components/Modal';
import { ModalCreateGroupPanel } from '../../GroupPanel/CreateGroupPanel';
import { Button } from '@/components/ui/official/button';
import { PlusIcon, RotateCcwIcon, SaveIcon } from 'lucide-react';
import { GroupDetailPage, GroupDetailSection } from '../Layout';

export const GroupPanel: React.FC<{
  groupId: string;
}> = React.memo((props) => {
  const groupId = props.groupId;
  const groupInfo = useGroupInfo(groupId);
  const groupPanels = groupInfo?.panels ?? [];
  const [editingGroupPanels, setEditingGroupPanels] = useState(groupPanels);
  const isEditingRef = useRef(false);

  useEffect(() => {
    // 如果不处于编辑状态, 则一直更新最新的面板
    if (isEditingRef.current === true) {
      return;
    }

    setEditingGroupPanels(groupPanels);
  }, [groupPanels]);

  const handleChange = useCallback((newGroupPanels: GroupPanelInfo[]) => {
    isEditingRef.current = true;
    setEditingGroupPanels(newGroupPanels);
  }, []);

  const [{ loading }, handleSave] = useAsyncRequest(async () => {
    await modifyGroupField(groupId, 'panels', editingGroupPanels);
    isEditingRef.current = false;
    showToasts(t('保存成功'), 'success');
  }, [editingGroupPanels]);

  const handleReset = useCallback(() => {
    setEditingGroupPanels(groupPanels);
    isEditingRef.current = false;
  }, [groupPanels]);

  const handleOpenCreatePanelModal = useCallback(() => {
    const key = openModal(
      <ModalCreateGroupPanel
        groupId={groupId}
        onSuccess={() => {
          closeModal(key);
          isEditingRef.current = false;
        }}
      />
    );
  }, []);

  const isDirty = !_isEqual(groupPanels, editingGroupPanels);

  return (
    <GroupDetailPage
      title={t('面板管理')}
      description={t('组织群组频道和面板，并调整成员看到的导航结构。')}
      action={
        <Button onClick={handleOpenCreatePanelModal}>
          <PlusIcon />
          {t('创建面板')}
        </Button>
      }
    >
      <GroupDetailSection
        title={t('频道结构')}
        description={t('拖动项目以重新排序，或将面板移动到其他分组。')}
      >
        <div className="max-h-[30rem] overflow-auto rounded-lg border border-border bg-background p-2">
          <GroupPanelTree
            groupId={groupId}
            groupPanels={editingGroupPanels}
            onChange={handleChange}
          />
        </div>

        {isDirty && (
          <div className="mt-4 flex items-center justify-end gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcwIcon />
              {t('重置')}
            </Button>
            <Button disabled={loading} aria-busy={loading} onClick={handleSave}>
              <SaveIcon />
              {t('保存')}
            </Button>
          </div>
        )}
      </GroupDetailSection>
    </GroupDetailPage>
  );
});
GroupPanel.displayName = 'GroupPanel';
