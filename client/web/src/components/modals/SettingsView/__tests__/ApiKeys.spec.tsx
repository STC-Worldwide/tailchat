import { render, screen } from '@testing-library/react';
import React from 'react';

const keys = [
  {
    keyId: 'abcd1234',
    name: 'ops agent',
    scopes: ['message:read', 'group:read'],
    createdAt: '2026-09-01T00:00:00.000Z',
    lastUsedAt: undefined,
    expiresAt: undefined,
    revoked: false,
  },
  {
    keyId: 'deadbeef',
    name: 'retired agent',
    scopes: ['admin'],
    createdAt: '2026-08-01T00:00:00.000Z',
    revokedAt: '2026-08-20T00:00:00.000Z',
    revoked: true,
  },
];

jest.mock('tailchat-shared', () => ({
  t: (value: string) => value,
  request: { post: jest.fn().mockResolvedValue({ data: [] }) },
  showToasts: jest.fn(),
  showSuccessToasts: jest.fn(),
  useAsyncRefresh: () => ({
    loading: false,
    value: keys,
    refresh: jest.fn(),
  }),
  useAsyncRequest: (fn: unknown) => [{ loading: false }, fn],
}));

jest.mock('@/components/Modal', () => ({
  openModal: jest.fn(),
  closeModal: jest.fn(),
  ModalWrapper: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

import { SettingsApiKeys } from '../ApiKeys';

describe('SettingsApiKeys', () => {
  test('lists keys by prefix and scope without ever rendering a full key', () => {
    const { container } = render(<SettingsApiKeys />);

    expect(screen.getByText('ops agent')).toBeTruthy();
    expect(screen.getByText('tck_abcd1234…')).toBeTruthy();
    expect(screen.getByText('message:read')).toBeTruthy();
    expect(screen.getAllByText('尚未使用').length).toBeGreaterThan(0);
    expect(screen.getAllByText('永不').length).toBeGreaterThan(0);

    // 完整密钥只在创建时展示一次, 列表中绝不出现
    expect(container.textContent).not.toMatch(/tck_[A-Za-z0-9]{20,}/);
  });

  test('offers revocation only for keys that are still live', () => {
    render(<SettingsApiKeys />);

    expect(screen.getByText('已吊销')).toBeTruthy();
    expect(screen.getByText('有效')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: '吊销' })).toHaveLength(1);
  });
});
