import { render, screen } from '@testing-library/react';
import React from 'react';
import { UserListItem } from '../UserListItem';

let mockUserInfo: Record<string, unknown> = {};

jest.mock('tailchat-shared', () => ({
  t: (key: string) => key,
  useCachedUserInfo: () => mockUserInfo,
  useCachedOnlineStatus: () => [true],
}));

jest.mock('../UserName', () => ({
  UserName: () => <span>Tim#9217</span>,
}));

describe('UserListItem', () => {
  afterEach(() => {
    mockUserInfo = {};
  });

  test('uses official Shadcn Skeleton primitives while loading', () => {
    const { container } = render(<UserListItem userId="user-1" />);

    expect(screen.getByRole('status', { name: '加载中' })).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      3
    );
  });

  test('renders the loaded user and tokenized online status', () => {
    mockUserInfo = { nickname: 'Tim', avatar: null };
    render(<UserListItem userId="user-1" />);

    expect(screen.getByText('Tim#9217')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('在线');
  });

  describe('compact', () => {
    /*
     * 这个组件导出给插件用, 默认行为不能变 —— 默认那套(56px + 分隔线)是给管理列表
     * 用的, 紧凑那套是给成员侧边栏用的, 两边都钉一下。
     */
    const rowOf = (container: HTMLElement) =>
      container.querySelector('.group') as HTMLElement;

    beforeEach(() => {
      mockUserInfo = { nickname: 'Tim', avatar: null };
    });

    test('the default row keeps its divider and full height', () => {
      const { container } = render(<UserListItem userId="user-1" />);
      const row = rowOf(container);

      expect(row.className).toContain('h-14');
      expect(row.className).toContain('border-b');
    });

    test('the compact row drops the divider and sits shorter', () => {
      const { container } = render(
        <UserListItem userId="user-1" compact={true} />
      );
      const row = rowOf(container);

      expect(row.className).toContain('h-11');
      expect(row.className).not.toContain('border-b');
      expect(row.className).toContain('rounded-md');
    });
  });
});
