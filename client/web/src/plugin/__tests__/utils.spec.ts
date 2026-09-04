import { getManifestFieldWithI18N } from '../utils';
import { getLanguage } from 'tailchat-shared';

jest.mock('tailchat-shared', () => ({
  getLanguage: jest.fn(),
}));

describe('getManifestFieldWithI18N', () => {
  const manifest = {
    label: 'Web Panel Plugin',
    'label.zh-CN': '网页面板插件',
    name: 'com.msgbyte.webview',
    url: '/plugins/com.msgbyte.webview/index.js',
    version: '0.0.0',
    author: 'msgbyte',
    description: 'Provides groups with the ability to create web panels',
    requireRestart: false,
  } as any;

  test('prefers the translation for the current language', () => {
    (getLanguage as jest.Mock).mockReturnValue('zh-CN');

    expect(getManifestFieldWithI18N(manifest, 'label')).toBe('网页面板插件');
  });

  test('falls back to the base field when there is no translation', () => {
    (getLanguage as jest.Mock).mockReturnValue('en-US');

    expect(getManifestFieldWithI18N(manifest, 'label')).toBe(
      'Web Panel Plugin'
    );
    // description has no per-language variant at all
    expect(getManifestFieldWithI18N(manifest, 'description')).toBe(
      'Provides groups with the ability to create web panels'
    );
  });
});
