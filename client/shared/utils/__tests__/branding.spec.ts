import { BRAND, getServerDisplayName } from '../branding';

describe('server display names across the Anchor Chat upgrade', () => {
  test.each([undefined, '', '  ', 'Tailchat'])(
    'replaces the old or missing default %p',
    (name) => expect(getServerDisplayName(name)).toBe(BRAND.product)
  );

  test.each(['Project 861', 'STC Worldwide', 'Tailchat Engineering'])(
    'preserves the custom server name %p',
    (name) => expect(getServerDisplayName(name)).toBe(name)
  );
});
