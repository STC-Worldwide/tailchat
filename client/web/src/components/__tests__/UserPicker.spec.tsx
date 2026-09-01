import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { UserPicker } from '../UserPicker/UserPicker';

const mockUsers = [
  { _id: 'user-1', nickname: 'Alice', avatar: '' },
  { _id: 'user-2', nickname: 'Bob', avatar: '' },
];

jest.mock('tailchat-shared', () => ({
  localTrans: (translations: Record<string, string>) => translations['en-US'],
  t: (key: string, variables?: { num?: number }) =>
    variables?.num === undefined
      ? key
      : key.replace('{{num}}', String(variables.num)),
  useUserInfoList: () => mockUsers,
}));

describe('official Shadcn UserPicker', () => {
  test('filters users and returns checkbox selections', () => {
    const handleChange = jest.fn();
    const { container } = render(
      <UserPicker
        allUserIds={mockUsers.map((user) => user._id)}
        selectedIds={[]}
        onChange={handleChange}
      />
    );

    expect(container.querySelector('[data-slot="input"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="checkbox"]')).toHaveLength(
      2
    );
    expect(container.querySelectorAll('[data-slot="avatar"]')).toHaveLength(2);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Alice' }));
    expect(handleChange).toHaveBeenCalledWith(['user-1']);

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索用户' }), {
      target: { value: 'bob' },
    });
    expect(screen.queryByText('Alice')).toBeNull();
    expect(screen.getByText('Bob')).toBeTruthy();

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索用户' }), {
      target: { value: 'nobody' },
    });
    expect(screen.getByText('No matching users')).toBeTruthy();
  });
});
