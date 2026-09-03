import { GroupPanelType } from 'tailchat-shared';
import { movePanel } from '../panel-move';

const text = (id: string, parentId?: string) =>
  ({
    id,
    name: id,
    type: GroupPanelType.TEXT,
    ...(parentId ? { parentId } : {}),
  } as any);

const category = (id: string) =>
  ({ id, name: id, type: GroupPanelType.GROUP } as any);

/**
 * 服务端存的是扁平数组, 所以断言写成 "id(parent)" 的顺序串, 一眼能看出
 * 顺序和归属两件事有没有同时对。
 */
const shape = (panels: any[]) =>
  panels.map((p) => `${p.id}(${p.parentId ?? '-'})`).join(' ');

// Lobby, bas-alarms 在顶层; Text Channel 是分组, 里面有 daily
const base = [
  text('lobby'),
  text('alarms'),
  category('cat'),
  text('daily', 'cat'),
];

describe('movePanel', () => {
  test('reorders two top-level channels', () => {
    const next = movePanel(base, 'alarms', 'lobby', 'before');
    expect(shape(next!)).toBe('alarms(-) lobby(-) cat(-) daily(cat)');
  });

  test('moves a channel into a category by dropping on it', () => {
    const next = movePanel(base, 'lobby', 'cat', 'inside');
    expect(shape(next!)).toBe('alarms(-) cat(-) daily(cat) lobby(cat)');
  });

  test('moves a channel out of a category back to the top level', () => {
    const next = movePanel(base, 'daily', 'lobby', 'before');
    expect(shape(next!)).toBe('daily(-) lobby(-) alarms(-) cat(-)');
  });

  test('dropping just under a category header lands inside it, at the top', () => {
    // 分组和它第一个子面板之间在扁平数组里没有位置可放, 所以这里的直觉
    // 解释是"放进分组的开头"
    const next = movePanel(base, 'lobby', 'cat', 'after');
    expect(shape(next!)).toBe('alarms(-) cat(-) lobby(cat) daily(cat)');
  });

  test('a channel dropped next to a nested channel joins that category', () => {
    const next = movePanel(base, 'alarms', 'daily', 'after');
    expect(shape(next!)).toBe('lobby(-) cat(-) daily(cat) alarms(cat)');
  });

  test('reorders siblings inside a category', () => {
    const panels = [
      category('cat'),
      text('a', 'cat'),
      text('b', 'cat'),
      text('c', 'cat'),
    ];
    const next = movePanel(panels, 'c', 'a', 'before');
    expect(shape(next!)).toBe('cat(-) c(cat) a(cat) b(cat)');
  });

  test('a category moves with its children', () => {
    const next = movePanel(base, 'cat', 'lobby', 'before');
    expect(shape(next!)).toBe('cat(-) daily(cat) lobby(-) alarms(-)');
  });

  describe('refuses moves the two-level model cannot represent', () => {
    test('a category cannot go inside anything', () => {
      expect(movePanel(base, 'cat', 'lobby', 'inside')).toBeNull();
    });

    test('a category cannot be dropped next to a nested channel', () => {
      expect(movePanel(base, 'cat', 'daily', 'after')).toBeNull();
    });

    test('only a category can be dropped into', () => {
      expect(movePanel(base, 'alarms', 'lobby', 'inside')).toBeNull();
    });
  });

  describe('reports "no change" rather than a pointless save', () => {
    test('dropping onto itself', () => {
      expect(movePanel(base, 'lobby', 'lobby', 'before')).toBeNull();
    });

    test('dropping where it already sits', () => {
      expect(movePanel(base, 'lobby', 'alarms', 'before')).toBeNull();
      expect(movePanel(base, 'alarms', 'lobby', 'after')).toBeNull();
    });

    test('an unknown id', () => {
      expect(movePanel(base, 'nope', 'lobby', 'before')).toBeNull();
      expect(movePanel(base, 'lobby', 'nope', 'before')).toBeNull();
    });
  });

  test('never mutates the array it was given', () => {
    const before = shape(base);
    movePanel(base, 'daily', 'lobby', 'before');
    expect(shape(base)).toBe(before);
  });
});
