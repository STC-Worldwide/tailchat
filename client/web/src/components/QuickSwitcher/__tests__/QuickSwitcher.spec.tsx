import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('../useQuickSwitcherActionContext', () => ({
  useQuickSwitcherActionContext: () => ({ navigate: jest.fn() }),
}));

jest.mock('../useQuickSwitcherAllAction', () => ({
  useQuickSwitcherAllActions: () => [
    {
      key: 'personal',
      source: 'core',
      label: '个人主页',
      action: jest.fn(),
    },
    {
      key: 'plugins',
      source: 'core',
      label: '插件中心',
      action: jest.fn(),
    },
  ],
}));

import { openQuickSwitcher } from '../index';
import { PortalHost } from '../../Portal';
import { act } from 'react-dom/test-utils';

describe('QuickSwitcher', () => {
  test('opens with all actions and filters via cmdk', () => {
    render(
      <PortalHost>
        <div />
      </PortalHost>
    );
    act(() => {
      openQuickSwitcher();
    });

    expect(screen.getByText('个人主页')).toBeTruthy();
    expect(screen.getByText('插件中心')).toBeTruthy();

    const input = screen.getByPlaceholderText('快速搜索、跳转');
    fireEvent.change(input, { target: { value: '插件' } });

    expect(screen.queryByText('个人主页')).toBeNull();
    expect(screen.getByText('插件中心')).toBeTruthy();
  });
});
