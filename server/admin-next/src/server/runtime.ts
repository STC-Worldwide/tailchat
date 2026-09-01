const ADMIN_TOKEN_PLATFORMS = new Set(['admin', 'admin-next']);

export function isAdminTokenPlatform(platform: unknown): boolean {
  return typeof platform === 'string' && ADMIN_TOKEN_PLATFORMS.has(platform);
}

export function getAdminPort(
  env: Record<string, string | undefined>
): number {
  return Number(env.ADMIN_PORT || env.ADMIN_NEXT_PORT || 3000);
}

export function getLegacyAdminRedirect(originalUrl: string): string | null {
  if (!/^\/admin-next(?:[/?]|$)/.test(originalUrl)) return null;
  if (/^\/admin-next\/api(?:[/?]|$)/.test(originalUrl)) return null;
  return originalUrl.replace(/^\/admin-next(?=[/?]|$)/, '/admin');
}
