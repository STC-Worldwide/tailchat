import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { FriendPanel } from '../index';

let mockDisableAddFriend = false;

jest.mock('tailchat-shared', () => ({
  localTrans: (translations: Record<string, string>) => translations['en-US'],
  t: (key: string) => key,
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        info: { _id: 'me' },
        friendRequests: [
          { _id: 'sent-1', from: 'me', to: 'other' },
          { _id: 'received-1', from: 'other', to: 'me' },
        ],
      },
    }),
  useGlobalConfigStore: (selector: (state: unknown) => unknown) =>
    selector({ disableAddFriend: mockDisableAddFriend }),
}));

jest.mock('../FriendList', () => ({
  FriendList: ({
    onSwitchToAddFriend,
  }: {
    onSwitchToAddFriend: () => void;
  }) => (
    <div>
      Friend list content
      <button type="button" onClick={onSwitchToAddFriend}>
        Switch to add friend
      </button>
    </div>
  ),
}));

jest.mock('../RequestSend', () => ({
  RequestSend: () => <div>Sent request content</div>,
}));

jest.mock('../RequestReceived', () => ({
  RequestReceived: () => <div>Received request content</div>,
}));

jest.mock('../AddFriend', () => ({
  AddFriend: () => <div>Add friend content</div>,
}));

describe('official Shadcn Friends tabs', () => {
  afterEach(() => {
    mockDisableAddFriend = false;
  });

  test('switches between friend workflows and exposes request counts', () => {
    render(<FriendPanel />);

    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByText('Friend list content')).toBeTruthy();
    expect(screen.getByRole('tab', { name: '已发送' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: '待处理' })).toBeTruthy();
    expect(screen.getAllByText('1')).toHaveLength(2);

    fireEvent.click(screen.getByRole('tab', { name: '已发送' }));
    expect(screen.getByText('Sent request content')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /全部/ }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to add friend' })
    );
    expect(screen.getByText('Add friend content')).toBeTruthy();
  });

  test('removes request and add tabs when friend discovery is disabled', () => {
    mockDisableAddFriend = true;
    render(<FriendPanel />);

    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.queryByRole('tab', { name: /添加好友/ })).toBeNull();
  });
});
