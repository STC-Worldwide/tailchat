/** Display names only. Storage, package, plugin and protocol IDs stay stable. */
export const BRAND = {
  product: 'Anchor Chat',
  company: 'STC Worldwide',
  byline: 'by STC Worldwide',
  fullName: 'Anchor Chat by STC Worldwide',
  assistant: 'BASsie',
} as const;

/** Old cached defaults may outlive an upgrade; custom server names belong to users. */
export function getServerDisplayName(name?: string): string {
  return !name?.trim() || name === 'Tailchat' ? BRAND.product : name;
}
