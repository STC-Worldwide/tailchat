import randomString from 'crypto-random-string';
import _ from 'lodash';
import urlRegex from 'url-regex';

/**
 * 返回电子邮箱的地址
 * @param email 电子邮箱
 * @returns 电子邮箱
 */
export function getEmailAddress(email: string) {
  return email.split('@')[0];
}

/**
 * 生成随机字符串
 * @param length 随机字符串长度
 */
export function generateRandomStr(length = 10): string {
  return randomString({ length });
}

export function generateRandomNumStr(length = 6) {
  return randomString({
    length,
    type: 'numeric',
  });
}

/**
 * 是否一个可用的字符串
 * 定义为有长度的字符串
 */
export function isValidStr(str: unknown): str is string {
  return typeof str == 'string' && str !== '';
}

/**
 * 判断是否是一个可用的url
 */
export function isValidUrl(str: unknown): str is string {
  return typeof str == 'string' && urlRegex({ exact: true }).test(str);
}

/**
 * 检测一个地址是否是一个合法的资源地址
 */
export function isValidStaticAssetsUrl(str: unknown): str is string {
  if (typeof str !== 'string') {
    return false;
  }

  const filename = _.last(str.split('/'));
  if (filename.indexOf('.') === -1) {
    return false;
  }

  return true;
}

/**
 * 休眠一定时间
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms)
  );
}

/**
 * 检查url地址是否匹配
 */
export function checkPathMatch(urlList: string[], url: string): boolean {
  const fuzzList = urlList.map((url) => url.replaceAll('/', '.'));
  const fuzzUrl = url.split('?')[0].replaceAll('/', '.');

  // 考虑到serviceName中间可能会有. 且注册的时候不可能把所有情况都列出来，因此进行模糊处理
  return fuzzList.includes(fuzzUrl);
}

/**
 * Should this static file be revalidated on every request rather than cached?
 *
 * Everything under `public/` is served with a one-day max-age, which is right
 * for content-hashed assets and wrong for the few files whose names are stable
 * across releases. A plugin's entry (`index.js`) and its `manifest.json` keep
 * the same URL forever and point at the hashed chunks, so caching them for a
 * day pins every browser to whichever plugin build it saw first: a plugin fix
 * stays invisible for up to 24 hours even after the app itself has updated.
 *
 * Hashed chunks are unaffected — a new build gives them new names anyway.
 */
export function isRevalidatingStaticAsset(filePath: string): boolean {
  const normalized = filePath.split('\\').join('/');
  const fileName = normalized.split('/').pop() ?? '';

  // The plugin registry is regenerated on every build under a stable name.
  if (fileName === 'registry-be.json' || fileName === 'registry.json') {
    return true;
  }

  if (!normalized.includes('/plugins/')) {
    return false;
  }

  // `index-8ef1afeb.js` carries its build in the name; `index.js` does not.
  const isContentHashed = /-[0-9a-f]{8,}\.\w+$/.test(fileName);

  return !isContentHashed;
}
