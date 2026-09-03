import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  GroupPanelType,
  modifyGroupField,
  showToasts,
  t,
  useGroupInfo,
  useHasGroupPermission,
  PERMISSION,
  type GroupPanel,
} from 'tailchat-shared';
import { movePanel, type DropPosition } from './panel-move';

/**
 * 侧边栏拖拽排序。
 *
 * 拖完立刻保存, 没有"保存"按钮 —— 设置页里那套先改后存的流程正是这个功能要
 * 替掉的东西。乐观更新交给 modifyGroupField 之后的 socket 广播, 失败了就提示,
 * 界面自然回到服务端的顺序。
 */

const MIME = 'application/x-tailchat-panel';

interface PanelDragValue {
  /** 有 managePanel 权限才允许拖 */
  canReorder: boolean;
  /** 只用来渲染(半透明、指示线) */
  dragId: string | null;
  /**
   * 正在拖的 id, 不经过渲染。dragstart 之后紧接着就会来 dragover, 中间不一定
   * 有一次 render, 所以判断逻辑读这个而不是读 state。
   */
  dragIdRef: React.MutableRefObject<string | null>;
  setDragId: (id: string | null) => void;
  target: { id: string; position: DropPosition } | null;
  setTarget: (value: { id: string; position: DropPosition } | null) => void;
  commit: (targetId: string, position: DropPosition) => void;
}

const PanelDragContext = createContext<PanelDragValue>({
  canReorder: false,
  dragId: null,
  dragIdRef: { current: null },
  setDragId: () => undefined,
  target: null,
  setTarget: () => undefined,
  commit: () => undefined,
});

export const PanelDragProvider: React.FC<
  React.PropsWithChildren<{ groupId: string }>
> = React.memo(({ groupId, children }) => {
  const groupInfo = useGroupInfo(groupId);
  const [hasManagePanel] = useHasGroupPermission(groupId, [
    PERMISSION.core.managePanel,
  ]);
  const [dragId, setDragIdState] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const [target, setTarget] = useState<PanelDragValue['target']>(null);

  const setDragId = useCallback((id: string | null) => {
    dragIdRef.current = id;
    setDragIdState(id);
  }, []);

  const panels = groupInfo?.panels ?? [];

  const commit = useCallback(
    (targetId: string, position: DropPosition) => {
      const dragging = dragIdRef.current;
      setDragId(null);
      setTarget(null);
      if (!dragging) return;

      const next = movePanel(panels, dragging, targetId, position);
      // null = 不允许, 或者压根没动。两种情况都不该发请求。
      if (!next) return;

      modifyGroupField(groupId, 'panels', next).catch((err) => {
        showToasts(
          t('调整顺序失败: {{reason}}', {
            reason: String(err?.message ?? err),
          }),
          'error'
        );
      });
    },
    [setDragId, groupId, panels]
  );

  const value = useMemo<PanelDragValue>(
    () => ({
      canReorder: hasManagePanel === true,
      dragId,
      dragIdRef,
      setDragId,
      target,
      setTarget,
      commit,
    }),
    [hasManagePanel, dragId, setDragId, target, commit]
  );

  return (
    <PanelDragContext.Provider value={value}>
      {children}
    </PanelDragContext.Provider>
  );
});
PanelDragProvider.displayName = 'PanelDragProvider';

export function usePanelDragContext() {
  return useContext(PanelDragContext);
}

/**
 * 一个面板既是拖拽源也是放置目标。返回值直接摊到元素上。
 *
 * 落点按指针在元素里的高度算: 分组中间的一段是"放进去", 其余是上下相邻;
 * 普通频道只有上下两半。
 */
export function usePanelDragHandlers(panel: GroupPanel) {
  const {
    canReorder,
    dragId,
    dragIdRef,
    setDragId,
    target,
    setTarget,
    commit,
  } = usePanelDragContext();
  const isCategory = panel.type === GroupPanelType.GROUP;

  const resolvePosition = useCallback(
    (event: React.DragEvent): DropPosition => {
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = (event.clientY - rect.top) / (rect.height || 1);
      if (isCategory) {
        if (ratio < 0.3) return 'before';
        if (ratio > 0.7) return 'after';
        return 'inside';
      }
      return ratio < 0.5 ? 'before' : 'after';
    },
    [isCategory]
  );

  const dragProps = canReorder
    ? {
        draggable: true,
        onDragStart: (event: React.DragEvent) => {
          setDragId(panel.id);
          event.dataTransfer.effectAllowed = 'move';
          // 一个自定义 MIME, 免得把外部拖进来的文件当成排序操作
          event.dataTransfer.setData(MIME, panel.id);
        },
        onDragEnd: () => {
          setDragId(null);
          setTarget(null);
        },
        onDragOver: (event: React.DragEvent) => {
          const dragging = dragIdRef.current;
          if (!dragging || dragging === panel.id) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          const position = resolvePosition(event);
          if (target?.id !== panel.id || target.position !== position) {
            setTarget({ id: panel.id, position });
          }
        },
        onDragLeave: () => {
          if (target?.id === panel.id) setTarget(null);
        },
        onDrop: (event: React.DragEvent) => {
          const dragging = dragIdRef.current;
          if (!dragging || dragging === panel.id) return;
          event.preventDefault();
          commit(panel.id, resolvePosition(event));
        },
      }
    : {};

  const active = target?.id === panel.id && dragId !== null;

  return {
    dragProps,
    isDragging: dragId === panel.id,
    /** 指示线画在上边还是下边; 'inside' 时整行高亮 */
    dropEdge: active && target?.position !== 'inside' ? target?.position : null,
    dropInside: active && target?.position === 'inside',
  };
}

/** 拖拽中的视觉反馈, 统一成一组 class */
export function panelDropClassName(state: {
  isDragging: boolean;
  dropEdge: DropPosition | null | undefined;
  dropInside: boolean;
}): string {
  return [
    'relative',
    state.isDragging ? 'opacity-40' : '',
    state.dropInside ? 'ring-2 ring-inset ring-primary/60 rounded-md' : '',
    state.dropEdge === 'before'
      ? 'before:absolute before:inset-x-1 before:-top-px before:h-0.5 before:rounded-full before:bg-primary before:content-[""]'
      : '',
    state.dropEdge === 'after'
      ? 'after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:content-[""]'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
}
