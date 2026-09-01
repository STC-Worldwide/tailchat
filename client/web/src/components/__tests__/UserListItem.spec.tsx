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
});
