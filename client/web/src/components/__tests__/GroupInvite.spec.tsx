import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createGroupInviteCode, model, showToasts } from 'tailchat-shared';
import { Modal } from '../Modal';
import { InviteCodeExpiredAt } from '../InviteCodeExpiredAt';
import { CreateGroupInvite } from '../modals/CreateGroupInvite';
import { EditGroupInvite } from '../modals/EditGroupInvite';
import { GroupInvite as GroupInviteManager } from '../modals/GroupDetail/Invite';

let mockInviteRows: unknown[] = [];

jest.mock('copy-to-clipboard', () => jest.fn());

jest.mock('tailchat-shared', () => ({
  buildPortal: () => ({
    PortalHost: () => null,
    PortalRender: () => null,
    add: jest.fn(() => 1),
    remove: jest.fn(),
  }),
  createGroupInviteCode: jest.fn(),
  deleteGroupInvite: jest.fn(),
  datetimeFromNow: () => 'in one hour',
  DefaultEventEmitter: class DefaultEventEmitter {},
  formatFullTime: () => 'September 1, 2026 12:00',
  getAllGroupInviteCode: jest.fn(),
  localTrans: (translations: Record<string, string>) => translations['en-US'],
  model: {
    group: {
      editGroupInvite: jest.fn(),
    },
  },
  PERMISSION: {
    core: {
      invite: 'core.invite',
      unlimitedInvite: 'core.unlimitedInvite',
    },
  },
  showToasts: jest.fn(),
  t: (key: string) => key,
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAsyncRequest: (callback: (...args: unknown[]) => Promise<unknown>) => [
    { loading: false },
    callback,
  ],
  useAsyncRefresh: () => ({
    loading: false,
    value: mockInviteRows,
    refresh: jest.fn(),
  }),
  useEvent: (callback: unknown) => callback,
  useGroupInfo: () => ({ _id: 'group-1', name: 'Modern Team' }),
  useHasGroupPermission: () => [true, true],
}));

describe('official Shadcn group invitation flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInviteRows = [];
    (createGroupInviteCode as jest.Mock).mockResolvedValue({
      code: 'invite-123',
      expiredAt: undefined,
      usageLimit: undefined,
    });
    (model.group.editGroupInvite as jest.Mock).mockResolvedValue(undefined);
  });

  test('creates an invitation and exposes the generated link accessibly', async () => {
    const { container } = render(
      <div id="tailchat-app">
        <Modal visible={true} closable={true} maskClosable={false}>
          <CreateGroupInvite groupId="group-1" />
        </Modal>
      </div>
    );

    expect(
      screen.getByRole('heading', { name: 'Invite people to the group' })
    ).toBeTruthy();
    expect(screen.getByText('Modern Team')).toBeTruthy();
    expect(container.querySelector('[data-slot="button"]')).toBeTruthy();

    const createButton = screen.getByRole('button', { name: '创建链接' });
    await waitFor(() => expect(document.activeElement).toBe(createButton));
    fireEvent.click(createButton);

    await waitFor(() =>
      expect(createGroupInviteCode).toHaveBeenCalledWith('group-1', 'normal')
    );
    const linkInput = await screen.findByLabelText('Invitation link');
    expect((linkInput as HTMLInputElement).readOnly).toBe(true);
    expect((linkInput as HTMLInputElement).value).toContain('invite-123');
    expect(screen.getByRole('button', { name: '复制邀请链接' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '编辑' })).toBeTruthy();
  });

  test('offers permanent invites through the official dropdown menu', async () => {
    render(
      <div id="tailchat-app">
        <Modal visible={true} closable={true} maskClosable={false}>
          <CreateGroupInvite groupId="group-1" />
        </Modal>
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: '更多' }));
    const permanentItem = await screen.findByRole('menuitem', {
      name: /创建永久邀请码/,
    });
    expect(
      document.querySelector('[data-slot="dropdown-menu-content"]')
    ).toBeTruthy();
    fireEvent.click(permanentItem);

    await waitFor(() =>
      expect(createGroupInviteCode).toHaveBeenCalledWith('group-1', 'permanent')
    );
    expect(await screen.findByLabelText('Invitation link')).toBeTruthy();
  });

  test('saves invitation limits through direct Shadcn select controls', async () => {
    const handleSuccess = jest.fn();
    const { container } = render(
      <div id="tailchat-app">
        <Modal visible={true} closable={true} maskClosable={false}>
          <EditGroupInvite
            groupId="group-1"
            code="invite-123"
            onEditSuccess={handleSuccess}
          />
        </Modal>
      </div>
    );

    expect(screen.getByRole('heading', { name: '编辑邀请链接' })).toBeTruthy();
    expect(
      container.querySelectorAll('[data-slot="select-trigger"]')
    ).toHaveLength(2);
    expect(screen.getByLabelText('过期时间')).toBeTruthy();
    expect(screen.getByLabelText('最大使用次数')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(model.group.editGroupInvite).toHaveBeenCalledWith(
        'group-1',
        'invite-123',
        undefined,
        undefined
      )
    );
    await waitFor(() =>
      expect(handleSuccess).toHaveBeenCalledWith({
        expiredAt: undefined,
        usageLimit: undefined,
      })
    );
    expect(showToasts).not.toHaveBeenCalled();
  });

  test('preserves an existing expiration and usage limit when saved unchanged', async () => {
    const handleSuccess = jest.fn();
    const existingExpiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    render(
      <div id="tailchat-app">
        <Modal visible={true} closable={true} maskClosable={false}>
          <EditGroupInvite
            groupId="group-1"
            code="invite-123"
            expiredAt={existingExpiredAt.toISOString()}
            usageLimit={5}
            onEditSuccess={handleSuccess}
          />
        </Modal>
      </div>
    );

    expect(screen.getByLabelText('过期时间').textContent).toContain(
      'Current setting · in one hour'
    );
    expect(screen.getByLabelText('最大使用次数').textContent).toContain(
      '5次使用'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(model.group.editGroupInvite).toHaveBeenCalledWith(
        'group-1',
        'invite-123',
        existingExpiredAt.valueOf(),
        5
      )
    );
    await waitFor(() =>
      expect(handleSuccess).toHaveBeenCalledWith({
        expiredAt: existingExpiredAt.valueOf(),
        usageLimit: 5,
      })
    );
  });

  test('renders responsive Shadcn management views for existing invites', () => {
    mockInviteRows = [
      {
        _id: 'invite-id-1',
        code: 'invite-123',
        createdAt: '2026-09-01T05:00:00.000Z',
        creator: 'user-1',
        expiredAt: undefined,
        usage: 2,
        usageLimit: 5,
      },
    ];

    const { container } = render(<GroupInviteManager groupId="group-1" />);

    expect(container.querySelector('[data-slot="table"]')).toBeTruthy();
    expect(container.querySelector('article')).toBeTruthy();
    expect(
      screen.getAllByRole('button', { name: '显示敏感信息' })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: '编辑邀请链接' })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: '复制邀请链接' })
    ).toHaveLength(2);
    const mobileCard = container.querySelector('article');
    expect(
      mobileCard?.querySelector('[aria-label="编辑邀请链接"]')?.className
    ).toContain('size-11');
    expect(
      mobileCard?.querySelector('[aria-label="复制邀请链接"]')?.className
    ).toContain('size-11');
    expect(
      mobileCard?.querySelector('[aria-label="删除"]')?.className
    ).toContain('size-11');
  });

  test('renders expiring invitation copy without leaking interpolation objects', () => {
    render(
      <div id="tailchat-app">
        <InviteCodeExpiredAt
          invite={{
            expiredAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            usageLimit: 5,
          }}
        />
      </div>
    );

    const expiryDate = screen.getByText('in one hour');
    expect(expiryDate.parentElement?.textContent).toBe('Expires in one hour');
    expect(screen.getByText('Can be used 5 times')).toBeTruthy();
  });
});
