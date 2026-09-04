import React, { useCallback } from 'react';
import {
  deleteGroupPanel,
  GroupPanelType,
  PERMISSION,
  showAlert,
  t,
  useHasGroupPermission,
  type GroupPanel,
} from 'tailchat-shared';
import { closeModal, openModal } from '@/components/Modal';
import { ModalCreateGroupPanel } from '@/components/modals/GroupPanel/CreateGroupPanel';
import { ModalModifyGroupPanel } from '@/components/modals/GroupPanel/ModifyGroupPanel';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import type { GroupPanelMenuItem } from './utils';

/**
 * 侧边栏右键菜单里的"增删改"。
 *
 * 这里是增删改频道的唯一入口: 设置页里那份面板管理已经删掉了 —— 要改一个
 * 频道, 不该先去设置里找到它。改动直接落库, 没有暂存和保存按钮。
 */
export function usePanelManageActions(groupId: string) {
  const [hasManagePanel] = useHasGroupPermission(groupId, [
    PERMISSION.core.managePanel,
  ]);

  const create = useCallback(
    (parentId?: string) => {
      const key = openModal(
        <ModalCreateGroupPanel
          groupId={groupId}
          parentId={parentId}
          onSuccess={() => closeModal(key)}
        />
      );
    },
    [groupId]
  );

  const modify = useCallback(
    (panelId: string) => {
      const key = openModal(
        <ModalModifyGroupPanel
          groupId={groupId}
          groupPanelId={panelId}
          onSuccess={() => closeModal(key)}
        />
      );
    },
    [groupId]
  );

  const remove = useCallback(
    (panel: GroupPanel) => {
      const isCategory = panel.type === GroupPanelType.GROUP;
      showAlert({
        // 删分组会连着里面的频道一起没, 这句必须说清楚
        message: isCategory
          ? t('确定要删除面板组 【{{name}}】 以及下级的所有面板么', {
              name: panel.name,
            })
          : t('确定要删除面板 【{{name}}】 么', { name: panel.name }),
        onConfirm: async () => {
          await deleteGroupPanel(groupId, panel.id);
        },
      });
    },
    [groupId]
  );

  /** 作用在某个面板上的菜单项; 没权限就返回空, 菜单里干脆不出现 */
  const itemsFor = useCallback(
    (panel: GroupPanel): GroupPanelMenuItem[] => {
      if (!hasManagePanel) return [];

      const isCategory = panel.type === GroupPanelType.GROUP;

      return [
        { key: 'manage-divider', type: 'divider' } as GroupPanelMenuItem,
        ...(isCategory
          ? [
              {
                key: 'create-in',
                label: t('在此分组内新建频道'),
                icon: <PlusIcon />,
                onClick: () => create(panel.id),
              },
            ]
          : []),
        {
          key: 'edit',
          label: isCategory ? t('编辑分组') : t('编辑频道'),
          icon: <PencilIcon />,
          onClick: () => modify(panel.id),
        },
        {
          key: 'delete',
          label: isCategory ? t('删除分组') : t('删除频道'),
          icon: <Trash2Icon />,
          onClick: () => remove(panel),
        },
      ] as GroupPanelMenuItem[];
    },
    [hasManagePanel, create, modify, remove]
  );

  /** 侧边栏空白处的菜单项 */
  const rootItems = useCallback((): GroupPanelMenuItem[] => {
    if (!hasManagePanel) return [];
    return [
      {
        key: 'create',
        label: t('新建频道或分组'),
        icon: <PlusIcon />,
        onClick: () => create(),
      },
    ] as GroupPanelMenuItem[];
  }, [hasManagePanel, create]);

  return { hasManagePanel: hasManagePanel === true, itemsFor, rootItems };
}
