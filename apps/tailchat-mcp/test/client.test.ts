import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ConfigError,
  TailchatApiError,
  TailchatClient,
  actionToPath,
  loadConfig,
} from '../src/client.js';

const KEY = 'tck_' + 'a'.repeat(44);

test('loadConfig validates the environment and normalises the url', () => {
  const cfg = loadConfig({
    TAILCHAT_URL: 'https://chat.example.com/',
    TAILCHAT_API_KEY: KEY,
  });
  assert.equal(cfg.url, 'https://chat.example.com');
  assert.equal(cfg.apiKey, KEY);
  assert.equal(cfg.timeoutMs, 15000);

  assert.throws(() => loadConfig({}), ConfigError);
  assert.throws(
    () =>
      loadConfig({ TAILCHAT_URL: 'chat.example.com', TAILCHAT_API_KEY: KEY }),
    /http/
  );
  assert.throws(
    () =>
      loadConfig({ TAILCHAT_URL: 'https://x', TAILCHAT_API_KEY: 'md5-token' }),
    /tck_/
  );
});

test('actionToPath follows the gateway rule for core and plugin services', () => {
  assert.equal(actionToPath('group.createGroup'), '/group/createGroup');
  assert.equal(
    actionToPath('group.invite.createGroupInvite'),
    '/group/invite/createGroupInvite'
  );
  assert.equal(
    actionToPath('chat.message.sendMessage'),
    '/chat/message/sendMessage'
  );
  // a plugin action known to the catalog
  assert.equal(
    actionToPath('plugin:com.msgbyte.tasks.all'),
    '/plugin:com.msgbyte.tasks/all'
  );
  // and one that is not: only the last segment splits off
  assert.equal(
    actionToPath('plugin:com.example.future.doThing'),
    '/plugin:com.example.future/doThing'
  );
  assert.throws(() => actionToPath('../etc'), /invalid action/);
  assert.throws(() => actionToPath('group createGroup'), /invalid action/);
});

function fakeFetch(
  handler: (url: string, init: RequestInit) => { status: number; body: unknown }
) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const { status, body } = handler(url, init);
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { calls, fetchImpl };
}

test('call posts JSON with the bearer key and unwraps the envelope', async () => {
  const { calls, fetchImpl } = fakeFetch(() => ({
    status: 200,
    body: { code: 200, data: { ok: 1 } },
  }));
  const client = new TailchatClient(
    { url: 'https://chat.example.com', apiKey: KEY, timeoutMs: 1000 },
    fetchImpl
  );

  const data = await client.call('group.getUserGroups', { a: 1 });
  assert.deepEqual(data, { ok: 1 });
  assert.equal(
    calls[0]?.url,
    'https://chat.example.com/api/group/getUserGroups'
  );
  assert.equal(calls[0]?.init.method, 'POST');
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers.authorization, `Bearer ${KEY}`);
  assert.equal(headers['content-type'], 'application/json');
  assert.equal(calls[0]?.init.body, JSON.stringify({ a: 1 }));
});

test('a gateway error becomes a TailchatApiError carrying status, type and a scope hint', async () => {
  const { fetchImpl } = fakeFetch(() => ({
    status: 403,
    body: {
      name: 'ForbiddenError',
      message: 'Forbidden',
      code: 403,
      type: 'API_KEY_SCOPE',
      data: { error: 'API key scope does not allow group.createGroup' },
    },
  }));
  const client = new TailchatClient(
    { url: 'https://chat.example.com', apiKey: KEY, timeoutMs: 1000 },
    fetchImpl
  );

  await assert.rejects(
    () => client.call('group.createGroup', { name: 'x' }),
    (err: unknown) => {
      assert.ok(err instanceof TailchatApiError);
      assert.equal(err.status, 403);
      assert.equal(err.type, 'API_KEY_SCOPE');
      assert.match(err.message, /group\.createGroup/);
      assert.match(err.message, /scope/);
      return true;
    }
  );
});

test('a network failure is reported with the action name, not swallowed', async () => {
  const client = new TailchatClient(
    { url: 'https://chat.example.com', apiKey: KEY, timeoutMs: 1000 },
    async () => {
      throw new Error('ECONNREFUSED');
    }
  );
  await assert.rejects(
    () => client.call('user.whoami'),
    /user\.whoami: request failed \(ECONNREFUSED\)/
  );
});
