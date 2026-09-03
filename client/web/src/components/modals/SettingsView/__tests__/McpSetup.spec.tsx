import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('tailchat-shared', () => ({
  t: (value: string) => value,
  showSuccessToasts: jest.fn(),
}));

import { SettingsMcpSetup } from '../McpSetup';

describe('SettingsMcpSetup', () => {
  test('offers a recipe per client, defaulting to Claude Code', () => {
    const { container } = render(<SettingsMcpSetup />);

    for (const label of [
      'Claude Code',
      'Claude Desktop',
      'Codex CLI (OpenAI)',
      'Cursor',
      '其它客户端',
    ]) {
      expect(screen.getByRole('tab', { name: label })).toBeTruthy();
    }

    // 默认页签的片段可见, 且用的是当前站点地址而不是写死的域名
    const snippet =
      container.querySelector('pre[aria-label="Claude Code"]')?.textContent ??
      '';
    expect(snippet).toContain('claude mcp add tailchat');
    expect(snippet).toContain(window.location.origin);

    // 每种客户端都给出了可复制的片段
    expect(
      container.querySelectorAll('pre[aria-label]').length
    ).toBeGreaterThan(1);
  });

  test('never renders anything that could be mistaken for a real key', () => {
    const { container } = render(<SettingsMcpSetup />);

    // 占位符是固定的 x, 真实密钥形如 tck_ + 44 位随机字符
    expect(container.textContent).toContain('tck_xxxx');
    expect(container.textContent).not.toMatch(/tck_(?!x)[A-Za-z0-9]{20,}/);
  });
});
