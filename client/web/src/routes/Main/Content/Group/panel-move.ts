import _cloneDeep from 'lodash/cloneDeep';
import _isNil from 'lodash/isNil';
import { GroupPanelType, type GroupPanel } from 'tailchat-shared';

/**
 * 侧边栏拖拽排序的纯逻辑。
 *
 * 面板在服务端是一个扁平数组, 顺序即展示顺序, 归属靠 parentId。约定是"分组紧跟
 * 着它的子面板", 见 rebuildGroupPanelOrder。这里先还原成两层结构再重建, 比在扁平
 * 数组上算下标更难写错。
 */

export type DropPosition = 'before' | 'after' | 'inside';

const isCategory = (panel: GroupPanel) => panel.type === GroupPanelType.GROUP;

interface Layout {
  /** 顶层条目, 按显示顺序 */
  top: GroupPanel[];
  /** 分组 id -> 子面板, 按显示顺序 */
  children: Map<string, GroupPanel[]>;
}

function toLayout(panels: GroupPanel[]): Layout {
  const top = panels.filter((panel) => _isNil(panel.parentId));
  const children = new Map<string, GroupPanel[]>();
  for (const panel of panels) {
    if (_isNil(panel.parentId)) continue;
    const list = children.get(panel.parentId);
    if (list) list.push(panel);
    else children.set(panel.parentId, [panel]);
  }
  return { top, children };
}

function fromLayout({ top, children }: Layout): GroupPanel[] {
  const out: GroupPanel[] = [];
  for (const panel of top) {
    out.push(panel);
    if (isCategory(panel)) {
      out.push(...(children.get(panel.id) ?? []));
    }
  }
  return out;
}

/** 把一个面板从它当前所在的列表里摘掉 */
function detach(layout: Layout, id: string): void {
  layout.top = layout.top.filter((panel) => panel.id !== id);
  for (const [parentId, list] of layout.children) {
    const next = list.filter((panel) => panel.id !== id);
    if (next.length !== list.length) layout.children.set(parentId, next);
  }
}

function insertAt(
  list: GroupPanel[],
  anchorId: string,
  position: 'before' | 'after',
  panel: GroupPanel
): void {
  const index = list.findIndex((item) => item.id === anchorId);
  if (index === -1) {
    list.push(panel);
    return;
  }
  list.splice(position === 'before' ? index : index + 1, 0, panel);
}

/**
 * 把 dragId 移动到 targetId 的前/后/内部, 返回新的扁平数组。
 *
 * 返回 null 表示这次移动不被允许或者没有变化 —— 调用方据此决定是否要发请求,
 * 免得把"拖到原位"也当成一次修改保存。
 */
export function movePanel(
  panels: GroupPanel[],
  dragId: string,
  targetId: string,
  position: DropPosition
): GroupPanel[] | null {
  if (dragId === targetId) return null;

  const source = _cloneDeep(panels);
  const drag = source.find((panel) => panel.id === dragId);
  const target = source.find((panel) => panel.id === targetId);
  if (!drag || !target) return null;

  // 不能把分组拖进任何东西里: 只有两层, 分组套分组没有意义, 也没有 UI 能展示。
  if (isCategory(drag) && position === 'inside') return null;
  // 也不能把分组拖到某个子面板旁边 —— 那会让它变成别人的孩子。
  if (isCategory(drag) && !_isNil(target.parentId)) return null;
  // 只有分组能被"拖进去"。
  if (position === 'inside' && !isCategory(target)) return null;

  const layout = toLayout(source);
  detach(layout, dragId);

  if (position === 'inside') {
    drag.parentId = target.id;
    const list = layout.children.get(target.id) ?? [];
    list.push(drag);
    layout.children.set(target.id, list);
  } else if (_isNil(target.parentId)) {
    // 目标在顶层
    if (isCategory(target) && !isCategory(drag) && position === 'after') {
      // 落在一个分组的下边缘, 直觉上是"放进这个分组的开头", 而不是挤在
      // 分组和它第一个子面板之间 —— 后者在扁平数组里根本表达不出来。
      drag.parentId = target.id;
      const list = layout.children.get(target.id) ?? [];
      list.unshift(drag);
      layout.children.set(target.id, list);
    } else {
      drag.parentId = undefined;
      insertAt(layout.top, target.id, position, drag);
    }
  } else {
    // 目标是某个分组里的子面板
    drag.parentId = target.parentId;
    const list = layout.children.get(target.parentId) ?? [];
    insertAt(list, target.id, position, drag);
    layout.children.set(target.parentId, list);
  }

  const next = fromLayout(layout);

  // 顺序和归属都没变就当作没动过
  const same =
    next.length === panels.length &&
    next.every(
      (panel, index) =>
        panel.id === panels[index].id &&
        (panel.parentId ?? null) === (panels[index].parentId ?? null)
    );

  return same ? null : next;
}
