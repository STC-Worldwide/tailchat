import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAdminPort,
  getLegacyAdminRedirect,
  isAdminTokenPlatform,
} from './runtime';

test('accepts canonical and transition admin tokens only', () => {
  assert.equal(isAdminTokenPlatform('admin'), true);
  assert.equal(isAdminTokenPlatform('admin-next'), true);
  assert.equal(isAdminTokenPlatform('web'), false);
  assert.equal(isAdminTokenPlatform(undefined), false);
});

test('prefers the canonical admin port with a transition fallback', () => {
  assert.equal(getAdminPort({ ADMIN_PORT: '3200', ADMIN_NEXT_PORT: '3100' }), 3200);
  assert.equal(getAdminPort({ ADMIN_NEXT_PORT: '3100' }), 3100);
  assert.equal(getAdminPort({}), 3000);
});

test('redirects legacy admin pages while preserving API compatibility', () => {
  assert.equal(getLegacyAdminRedirect('/admin-next'), '/admin');
  assert.equal(
    getLegacyAdminRedirect('/admin-next/users?status=active'),
    '/admin/users?status=active'
  );
  assert.equal(getLegacyAdminRedirect('/admin-next/api/users'), null);
  assert.equal(getLegacyAdminRedirect('/admin/users'), null);
});
