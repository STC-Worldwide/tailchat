import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('tailchat-shared', () => ({
  t: (value: string) => value,
  showSuccessToasts: jest.fn(),
}));

import { SettingsMcpSetup } from '../McpSetup';

const codeOf = (container: HTMLElement, label: string) =>
  container.querySelector(`pre[aria-label="${label}"]`)?.textContent ?? '';

describe('SettingsMcpSetup', () => {
  test('leads with the hosted endpoint on this origin', () => {
    const { container } = render(<SettingsMcpSetup />);

    const endpoint = `${window.location.origin}/mcp`;
    expect(codeOf(container, '端点地址')).toBe(endpoint);

    // 托管方式给出网址和请求头, 不需要仓库路径
    const hosted = codeOf(container, '托管 Claude Code');
    expect(hosted).toContain('--transport http');
    expect(hosted).toContain(endpoint);
    expect(hosted).not.toContain('/path/to/tailchat');
  });

  test('keeps a local stdio fallback for clients without remote support', () => {
    const { container } = render(<SettingsMcpSetup />);

    const local = codeOf(container, '本地 Claude Code');
    expect(local).toContain('claude mcp add tailchat');
    expect(local).toContain('apps/tailchat-mcp/dist/src/index.js');
    expect(codeOf(container, '构建命令')).toContain(
      'pnpm --dir apps/tailchat-mcp build'
    );
  });

  test('offers a recipe per client in both strips', () => {
    render(<SettingsMcpSetup />);

    // 同一个客户端在两处各有一个页签
    for (const label of ['Claude Code', 'Claude Desktop', '其它客户端']) {
      expect(screen.getAllByRole('tab', { name: label })).toHaveLength(2);
    }
    // Cursor 只在托管里, Codex 只在本地里
    expect(screen.getAllByRole('tab', { name: 'Cursor' })).toHaveLength(1);
    expect(
      screen.getAllByRole('tab', { name: 'Codex CLI (OpenAI)' })
    ).toHaveLength(1);
  });

  test('never renders anything that could be mistaken for a real key', () => {
    const { container } = render(<SettingsMcpSetup />);

    // 占位符是固定的 x, 真实密钥形如 tck_ + 44 位随机字符
    expect(container.textContent).toContain('tck_xxxx');
    expect(container.textContent).not.toMatch(/tck_(?!x)[A-Za-z0-9]{20,}/);
  });
});
