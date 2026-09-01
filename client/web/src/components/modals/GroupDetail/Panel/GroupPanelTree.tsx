import React, { useCallback, useMemo, useState } from 'react';
import {
  deleteGroupPanel,
  GroupPanel as GroupPanelInfo,
  showAlert,
  t,
} from 'tailchat-shared';
import { buildTreeDataWithGroupPanel, GroupPanelTreeNode } from './utils';
import { useGroupPanelTreeDrag } from './useGroupPanelTreeDrag';
import { closeModal, openModal } from '@/components/Modal';
import { ModalModifyGroupPanel } from '../../GroupPanel/ModifyGroupPanel';
import { Button } from '@/components/ui/official/button';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  GripVerticalIcon,
  HashIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';

interface GroupPanelTreeProps {
  groupId: string;
  groupPanels: GroupPanelInfo[];
  onChange: (newGroupPanels: GroupPanelInfo[]) => void;
}

/**
 * Expandable tokenized tree for panel management. Nodes use native drag/drop
 * so the panel editor no longer relies on Ant Design's tree renderer.
 */
export const GroupPanelTree: React.FC<GroupPanelTreeProps> = React.memo(
  (props) => {
    const treeData = useMemo(
      () => buildTreeDataWithGroupPanel(props.groupPanels),
      [props.groupPanels]
    );
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
      () =>
        new Set(treeData.filter((node) => !node.isLeaf).map((node) => node.key))
    );
    const [dragKey, setDragKey] = useState<string | null>(null);

    const handleModifyPanel = useCallback(
      (panelId: string) => {
        const key = openModal(
          <ModalModifyGroupPanel
            groupId={props.groupId}
            groupPanelId={panelId}
            onSuccess={() => closeModal(key)}
          />
        );
      },
      [props.groupId]
    );

    const handleDeletePanel = useCallback(
      (panelId: string, panelName: string, isGroup: boolean) => {
        showAlert({
          message: isGroup
            ? t('确定要删除面板组 【{{name}}】 以及下级的所有面板么', {
                name: panelName,
              })
            : t('确定要删除面板 【{{name}}】 么', { name: panelName }),
          onConfirm: async () => {
            await deleteGroupPanel(props.groupId, panelId);
          },
        });
      },
      [props.groupId]
    );

    const { handleDragStart, handleDragEnd, handleAllowDrop, handleDrop } =
      useGroupPanelTreeDrag(props.groupPanels, props.onChange);

    const toggleExpanded = (key: string) => {
      setExpandedKeys((current) => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    };

    const renderNode = (
      node: GroupPanelTreeNode,
      depth = 0
    ): React.ReactNode => {
      const expanded = expandedKeys.has(node.key);
      const isDragging = dragKey === node.key;
      const dropPosition = node.isLeaf || node.key === dragKey ? 1 : 0;

      return (
        <React.Fragment key={node.key}>
          <div
            draggable
            role="treeitem"
            aria-expanded={!node.isLeaf ? expanded : undefined}
            className={`group flex min-h-10 cursor-grab items-center rounded-md px-2 py-1 text-foreground transition-colors hover:bg-muted/50 active:cursor-grabbing ${
              isDragging ? 'opacity-50' : ''
            }`}
            style={{ paddingLeft: 8 + depth * 20 }}
            onDragStart={(event) => {
              setDragKey(node.key);
              handleDragStart({ node });
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', node.key);
            }}
            onDragEnd={() => {
              setDragKey(null);
              handleDragEnd();
            }}
            onDragOver={(event) => {
              if (node.key === dragKey) return;
              if (handleAllowDrop({ dropNode: node, dropPosition }) === false) {
                event.dataTransfer.dropEffect = 'none';
                return;
              }
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (node.key === dragKey) return;
              if (handleAllowDrop({ dropNode: node, dropPosition }) === false)
                return;
              const dragNode = treeData
                .flatMap((candidate) => [
                  candidate,
                  ...(candidate.children ?? []),
                ])
                .find((candidate) => candidate.key === dragKey);
              if (!dragNode) return;
              handleDrop({
                node,
                dragNode,
                dragNodesKeys: [dragNode.key],
                dropPosition,
                dropToGap: dropPosition !== 0,
              });
              setDragKey(null);
            }}
          >
            <GripVerticalIcon className="mr-1 size-4 shrink-0 text-muted-foreground/70" />
            {!node.isLeaf ? (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={expanded ? t('收起') : t('展开')}
                className="mr-1"
                onClick={() => toggleExpanded(node.key)}
              >
                {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </Button>
            ) : (
              <span className="mr-1 h-6 w-6" />
            )}

            {node.isLeaf ? (
              <HashIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
            ) : (
              <FolderIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {node.title}
            </span>
            <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t('编辑')}
                title={t('编辑')}
                onClick={(event) => {
                  event.stopPropagation();
                  handleModifyPanel(node.key);
                }}
              >
                <PencilIcon />
              </Button>
              <Button
                variant="destructive"
                size="icon-xs"
                aria-label={t('删除')}
                title={t('删除')}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeletePanel(node.key, node.title, !node.isLeaf);
                }}
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
          {!node.isLeaf &&
            expanded &&
            node.children?.map((child) => renderNode(child, depth + 1))}
        </React.Fragment>
      );
    };

    return (
      <div role="tree" aria-label={t('群组面板')} className="space-y-0.5">
        {treeData.map((node) => renderNode(node))}
      </div>
    );
  }
);
GroupPanelTree.displayName = 'GroupPanelTree';
