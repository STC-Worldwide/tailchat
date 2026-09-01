import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { model } from 'tailchat-shared';
import { GroupConfig } from '../Config';

const mockDispatch = jest.fn();

jest.mock('tailchat-shared', () => ({
  groupActions: {
    updateGroupConfig: (payload: unknown) => ({
      type: 'group/update-config',
      payload,
    }),
  },
  model: {
    group: {
      modifyGroupConfig: jest.fn().mockResolvedValue(undefined),
    },
  },
  showSuccessToasts: jest.fn(),
  t: (key: string) => key,
  useAppDispatch: () => mockDispatch,
  useAsyncRequest: (callback: (...args: unknown[]) => Promise<unknown>) => [
    { loading: false },
    callback,
  ],
  useGroupInfo: () => ({
    config: {
      hideGroupMemberDiscriminator: false,
      disableCreateConverseFromGroup: false,
    },
  }),
}));

jest.mock('@/components/ImageUploader', () => ({
  ImageUploader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('@/plugin/common', () => ({
  pluginGroupConfigItems: [],
}));

jest.mock('@/utils/plugin-helper', () => ({
  ensurePluginNamePrefix: (name: string) => name,
}));

describe('official Shadcn group detail controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders labelled direct switches and persists privacy changes', async () => {
    render(<GroupConfig groupId="group-1" />);

    const hideNameSwitch = screen.getByRole('switch', {
      name: '隐藏成员完整名称',
    });
    expect(hideNameSwitch.getAttribute('data-slot')).toBe('switch');
    expect(
      screen
        .getByRole('switch', { name: '禁止在群组发起私信' })
        .getAttribute('data-slot')
    ).toBe('switch');

    fireEvent.click(hideNameSwitch);

    await waitFor(() =>
      expect(model.group.modifyGroupConfig).toHaveBeenCalledWith(
        'group-1',
        'hideGroupMemberDiscriminator',
        true
      )
    );
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'group/update-config',
        payload: {
          groupId: 'group-1',
          configName: 'hideGroupMemberDiscriminator',
          configValue: true,
        },
      })
    );
  });
});
