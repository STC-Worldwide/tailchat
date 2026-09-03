import { t } from '../index';
/**
 * 休眠一定时间
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms)
  );
}

describe('i18n', () => {
  test('should be work', async () => {
    await sleep(2000); // 等待异步加载完毕

    // default language is en-US (see ../index.ts init)
    expect(t('Token不合规')).toBe('Token Invalid');
    expect(
      t('Token不合规', undefined, {
        lng: 'en-US',
      })
    ).toBe('Token Invalid');
    expect(
      t('Token不合规', undefined, {
        lng: 'zh-CN',
      })
    ).toBe('Token不合规');
    // an untranslated key falls back to the key itself
    expect(t('__no_such_translation__')).toBe('__no_such_translation__');
  });
});
