import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
  applyDefaultFallbackGroupPermission,
  createGroup,
} from 'tailchat-shared';
import { Modal } from '../Modal';
import { ModalCreateGroup } from '../modals/CreateGroup';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('tailchat-shared', () => ({
  applyDefaultFallbackGroupPermission: jest.fn(),
  buildPortal: () => ({
    PortalHost: () => null,
    PortalRender: () => null,
    add: jest.fn(() => 1),
    remove: jest.fn(),
  }),
  createGroup: jest.fn(),
  DefaultEventEmitter: class DefaultEventEmitter {},
  groupActions: {
    appendGroups: (groups: unknown[]) => ({ type: 'appendGroups', groups }),
  },
  GroupPanelType: {
    GROUP: 0,
    TEXT: 1,
  },
  localTrans: (translations: Record<string, string>) => translations['en-US'],
  t: (key: string) => key,
  useAppDispatch: () => mockDispatch,
  useAsyncRequest: (callback: () => Promise<unknown>) => [
    { loading: false },
    callback,
  ],
}));

describe('official Shadcn Create Group flow', () => {
  beforeEach(() => {
    mockDispatch.mockReset();
    mockNavigate.mockReset();
    (createGroup as jest.Mock).mockReset();
    (createGroup as jest.Mock).mockResolvedValue({ _id: 'group-1' });
    (applyDefaultFallbackGroupPermission as jest.Mock).mockReset();
    (applyDefaultFallbackGroupPermission as jest.Mock).mockResolvedValue(
      undefined
    );
  });

  test('creates a group through an accessible two-step flow', async () => {
    const { container } = render(
      <div id="tailchat-app">
        <Modal visible={true} closable={true} maskClosable={false}>
          <ModalCreateGroup />
        </Modal>
      </div>
    );

    expect(screen.getByRole('heading', { name: '创建群组' })).toBeTruthy();
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="button"]')).toHaveLength(3);
    expect(screen.getByRole('button', { name: '关闭' })).toBeTruthy();
    const firstTemplate = screen.getByRole('button', { name: /默认群组/ });
    await waitFor(() => expect(document.activeElement).toBe(firstTemplate));

    fireEvent.click(screen.getByRole('button', { name: /工作协同/ }));

    expect(
      screen.getByRole('heading', { name: '自定义你的群组' })
    ).toBeTruthy();
    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    const nameInput = screen.getByLabelText('群组名称');
    const createButton = screen.getByRole('button', { name: 'Create group' });
    expect((createButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(nameInput, { target: { value: '  Modern Team  ' } });
    expect((createButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(createButton);

    await waitFor(() => expect(createGroup).toHaveBeenCalledTimes(1));
    const [, panels] = (createGroup as jest.Mock).mock.calls[0] as [
      string,
      Array<{ id: string }>
    ];
    expect(createGroup).toHaveBeenCalledWith('Modern Team', panels);
    expect(panels.map((panel) => panel.id)).toEqual([
      '00',
      '01',
      '10',
      '11',
      '12',
    ]);
    expect(new Set(panels.map((panel) => panel.id)).size).toBe(panels.length);
    await waitFor(() =>
      expect(applyDefaultFallbackGroupPermission).toHaveBeenCalledWith(
        'group-1'
      )
    );
  });
});
