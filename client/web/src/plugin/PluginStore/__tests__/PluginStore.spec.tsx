import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { PluginStore } from '../index';
import { PluginStoreItem } from '../Item';
import { pluginManager } from '../../manager';

const mockRegistryPlugin = {
  label: 'Registry plugin',
  name: 'com.example.registry',
  url: '/registry.js',
  version: '1.0.0',
  author: 'Example',
  description: 'Available from the registry',
  requireRestart: false,
};

jest.mock('../../builtin', () => ({
  builtinPlugins: [
    {
      label: 'Built-in plugin',
      name: 'com.example.builtin',
      url: '/builtin.js',
      version: '1.0.0',
      author: 'Tailchat',
      description: 'Ships with Tailchat',
      requireRestart: false,
    },
  ],
}));

jest.mock('../../manager', () => ({
  pluginManager: {
    getInstalledPlugins: jest.fn(),
    getRegistryPlugins: jest.fn(),
    installPlugin: jest.fn(),
    uninstallPlugin: jest.fn(),
  },
}));

jest.mock('../../common', () => ({
  ModalWrapper: ({ children }: { children: React.ReactNode }) => children,
  openModal: jest.fn(),
}));

jest.mock('tailchat-shared', () => ({
  getLanguage: () => 'en-US',
  isValidJson: (value: string) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  isValidStr: (value: unknown) => typeof value === 'string' && value.length > 0,
  localTrans: (translations: Record<string, string>) => translations['en-US'],
  parseUrlStr: (value: string) => value,
  showAlert: jest.fn(),
  showToasts: jest.fn(),
  t: (key: string) => key,
  useAsync: (callback: () => unknown) =>
    String(callback).includes('getInstalledPlugins')
      ? {
          loading: false,
          value: [
            {
              label: 'Installed plugin',
              name: 'com.example.installed',
              url: '/installed.js',
              version: '1.0.0',
              author: 'Example',
              description: 'Already installed',
              requireRestart: false,
            },
          ],
        }
      : {
          loading: false,
          value: [
            {
              label: 'Registry plugin',
              name: 'com.example.registry',
              url: '/registry.js',
              version: '1.0.0',
              author: 'Example',
              description: 'Available from the registry',
              requireRestart: false,
            },
          ],
        },
  useAsyncRequest: (callback: () => Promise<unknown>) => [
    { loading: false },
    callback,
  ],
}));

describe('official Shadcn Plugin Store', () => {
  beforeEach(() => {
    (pluginManager.installPlugin as jest.Mock).mockReset();
    (pluginManager.uninstallPlugin as jest.Mock).mockReset();
  });

  test('switches between installed, registry, and manual-install workflows', () => {
    const { container } = render(<PluginStore />);

    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(2);
    expect(screen.getByText('Built-in plugin')).toBeTruthy();
    expect(screen.getByText('Installed plugin')).toBeTruthy();
    expect(
      screen
        .getByRole('region', { name: '已安装' })
        .getAttribute('aria-labelledby')
    ).toBe('plugin-section-installed');

    fireEvent.click(screen.getByRole('tab', { name: /全部/ }));
    expect(screen.getByText('Registry plugin')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '内置插件' })).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /手动安装/ }));
    expect(screen.getByRole('heading', { name: '手动安装' })).toBeTruthy();
    expect(screen.getByLabelText('Plugin manifest JSON')).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: 'Install plugin',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  test('installs a registry plugin and exposes the official card primitives', async () => {
    const { container } = render(
      <PluginStoreItem manifest={mockRegistryPlugin} installed={false} />
    );

    expect(container.querySelector('[data-slot="card"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="avatar"]')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '安装' }));

    await waitFor(() =>
      expect(pluginManager.installPlugin).toHaveBeenCalledTimes(1)
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Uninstall' })).toBeTruthy()
    );
  });

  test('shows inline JSON validation before manual installation', () => {
    render(<PluginStore />);
    fireEvent.click(screen.getByRole('tab', { name: /手动安装/ }));

    fireEvent.change(screen.getByLabelText('Plugin manifest JSON'), {
      target: { value: '{invalid' },
    });

    expect(
      screen.getByText('不是一个合法的JSON字符串').closest('[role="alert"]')
    ).toBeTruthy();
  });
});
