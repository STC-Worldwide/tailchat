// Drives the real tool surface through an in-memory MCP client against a fake gateway,
// so what is asserted is the wire behaviour an agent sees: tool names, argument
// validation, the requests each tool makes, and the shape of what comes back.

import assert from 'node:assert/strict';
import test from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { TailchatClient } from '../src/client.js';
import { registerTools } from '../src/tools.js';

const KEY = 'tck_' + 'b'.repeat(44);
const OWNER = '000000000000000000000001';
const ALICE = '000000000000000000000002';
const GROUP = '0000000000000000000000aa';
const LOBBY = 'panel-lobby';

type Recorded = { path: string; body: any };

function gateway(routes: Record<string, (body: any) => unknown>) {
  const calls: Recorded[] = [];
  const fetchImpl = async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname.replace(/^\/api/, '');
    const body = init.body ? JSON.parse(String(init.body)) : {};
    calls.push({ path, body });
    const route = routes[path];
    if (!route) {
      return new Response(
        JSON.stringify({
          name: 'NotFoundError',
          message: `Not found: ${path}`,
          code: 404,
        }),
        { status: 404, headers: { 'content-type': 'application/json' } }
      );
    }
    try {
      return new Response(JSON.stringify({ code: 200, data: route(body) }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } catch (err) {
      const e = err as any;
      return new Response(
        JSON.stringify({
          name: e.name,
          message: e.message,
          code: e.code ?? 500,
          type: e.type,
          data: e.data,
        }),
        {
          status: e.code ?? 500,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
  };
  return { calls, fetchImpl };
}

const group = () => ({
  _id: GROUP,
  name: 'STC',
  owner: OWNER,
  members: [
    { userId: OWNER, roles: [] },
    { userId: ALICE, roles: ['role-1'] },
  ],
  panels: [
    { id: LOBBY, name: 'general', type: 0 },
    { id: 'panel-cat', name: 'Projects', type: 1 },
  ],
  roles: [{ _id: 'role-1', name: 'Engineers', permissions: ['core.message'] }],
});

async function harness(routes: Record<string, (body: any) => unknown>) {
  const { calls, fetchImpl } = gateway(routes);
  const tc = new TailchatClient(
    { url: 'https://chat.example.com', apiKey: KEY, timeoutMs: 1000 },
    fetchImpl
  );
  const server = new McpServer({ name: 'test', version: '0' });
  registerTools(server, tc);
  const client = new Client({ name: 'test-client', version: '0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const res: any = await client.callTool({ name, arguments: args });
    const text = res.content?.[0]?.text ?? '';
    return { isError: Boolean(res.isError), text, json: safeParse(text) };
  };
  return {
    calls,
    call,
    client,
    close: () => Promise.all([client.close(), server.close()]),
  };
}

function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

test('registers the tool surface', async () => {
  const h = await harness({});
  const { tools } = await h.client.listTools();
  const names = tools.map((t) => t.name).sort();
  for (const expected of [
    'tailchat_whoami',
    'tailchat_list_groups',
    'tailchat_create_group',
    'tailchat_create_channel',
    'tailchat_add_member',
    'tailchat_send_message',
    'tailchat_read_messages',
    'tailchat_send_dm',
    'tailchat_inbox',
    'tailchat_actions',
    'tailchat_call',
  ]) {
    assert.ok(names.includes(expected), `missing ${expected}`);
  }
  assert.ok(tools.every((t) => t.name.startsWith('tailchat_')));
  await h.close();
});

test('whoami reports the bot and its scopes but never the token', async () => {
  const h = await harness({
    '/user/whoami': () => ({
      user: { _id: OWNER, nickname: 'Bot', email: 'bot@x', avatar: '' },
      token: KEY,
      userId: OWNER,
      apiKey: {
        keyId: 'k1',
        appId: 'tc_1',
        scopes: ['group:manage', 'message:write'],
      },
    }),
  });
  const r = await h.call('tailchat_whoami');
  assert.equal(r.isError, false);
  assert.equal(r.json.user.nickname, 'Bot');
  assert.deepEqual(r.json.apiKey.scopes, ['group:manage', 'message:write']);
  assert.ok(!r.text.includes(KEY), 'token must not leak into the result');
  await h.close();
});

test('create_group builds panels with ids and parent links', async () => {
  const h = await harness({
    '/group/createGroup': (body) => ({
      ...group(),
      name: body.name,
      panels: body.panels,
    }),
  });
  const r = await h.call('tailchat_create_group', {
    name: 'Project 861',
    channels: [
      { name: 'Site', type: 'category' },
      { name: 'general' },
      { name: 'ahu', parent: 'Site' },
    ],
  });
  assert.equal(r.isError, false, r.text);
  const sent = h.calls[0]?.body.panels;
  assert.equal(sent.length, 3);
  assert.equal(sent[0].type, 1);
  assert.equal(sent[1].type, 0);
  assert.equal(sent[2].parentId, sent[0].id);
  assert.ok(
    sent.every((p: any) => typeof p.id === 'string' && p.id.length > 0)
  );
  assert.equal(r.json.channels[2].parentId, sent[0].id);

  const bad = await h.call('tailchat_create_group', {
    name: 'x',
    channels: [{ name: 'a', parent: 'nope' }],
  });
  assert.equal(bad.isError, true);
  assert.match(bad.text, /parent "nope"/);
  await h.close();
});

test('send_message with a reply adds the @-tag and reply meta', async () => {
  const h = await harness({
    '/chat/message/getMessage': () => ({
      _id: 'm0',
      author: ALICE,
      content: 'hello?',
    }),
    '/chat/message/sendMessage': (body) => ({ _id: 'm1', ...body }),
  });
  const r = await h.call('tailchat_send_message', {
    converseId: LOBBY,
    groupId: GROUP,
    content: 'hi Alice',
    replyToMessageId: 'm0',
  });
  assert.equal(r.isError, false, r.text);
  const sent = h.calls.find(
    (c) => c.path === '/chat/message/sendMessage'
  )!.body;
  assert.equal(sent.content, `[at=${ALICE}][/at] hi Alice`);
  assert.equal(sent.plain, 'hi Alice');
  assert.deepEqual(sent.meta.reply, {
    _id: 'm0',
    author: ALICE,
    content: 'hello?',
  });
  assert.deepEqual(sent.meta.mentions, [ALICE]);
  assert.equal(sent.groupId, GROUP);
  assert.equal(r.json.id, 'm1');
  await h.close();
});

test('add_member resolves Nickname#0000 and relays a permission refusal', async () => {
  const h = await harness({
    '/user/searchUserWithUniqueName': (body) =>
      body.uniqueName === 'Alice#1234'
        ? { _id: ALICE, nickname: 'Alice', discriminator: '1234' }
        : null,
    '/group/addGroupMember': () => {
      const e: any = new Error('No operate permission');
      e.code = 403;
      e.name = 'NoPermissionError';
      throw e;
    },
  });
  const r = await h.call('tailchat_add_member', {
    groupId: GROUP,
    uniqueName: 'Alice#1234',
  });
  assert.equal(r.isError, true);
  assert.match(r.text, /No operate permission/);
  assert.match(r.text, /HTTP 403/);
  assert.deepEqual(h.calls[1]?.body, { groupId: GROUP, userId: ALICE });

  const missing = await h.call('tailchat_add_member', {
    groupId: GROUP,
    uniqueName: 'Nobody#0000',
  });
  assert.match(missing.text, /no user named Nobody#0000/);
  await h.close();
});

test('read_messages resolves nicknames and pages backwards', async () => {
  const h = await harness({
    '/chat/message/fetchConverseMessage': (body) =>
      body.startId === 'm2'
        ? [{ _id: 'm1', author: ALICE, content: 'one' }]
        : [
            { _id: 'm3', author: OWNER, content: 'three' },
            { _id: 'm2', author: ALICE, content: 'two' },
          ],
    '/user/getUserInfoList': (body) =>
      body.userIds.map((id: string) => ({
        _id: id,
        nickname: id === ALICE ? 'Alice' : 'Bot',
      })),
  });
  const r = await h.call('tailchat_read_messages', { converseId: LOBBY });
  assert.equal(r.isError, false, r.text);
  assert.deepEqual(
    r.json.messages.map((m: any) => [m.id, m.author.nickname]),
    [
      ['m2', 'Alice'],
      ['m3', 'Bot'],
    ]
  );
  assert.equal(r.json.oldestMessageId, 'm2');

  const older = await h.call('tailchat_read_messages', {
    converseId: LOBBY,
    beforeMessageId: 'm2',
  });
  assert.deepEqual(
    older.json.messages.map((m: any) => m.id),
    ['m1']
  );
  await h.close();
});

test('get_group names roles and members, and explains a group the bot is not in', async () => {
  const h = await harness({
    '/group/getUserGroups': () => [group()],
    '/user/getUserInfoList': (body) =>
      body.userIds.map((id: string) => ({
        _id: id,
        nickname: id === ALICE ? 'Alice' : 'Bot',
      })),
  });
  const r = await h.call('tailchat_get_group', { groupId: GROUP });
  assert.equal(r.isError, false, r.text);
  assert.deepEqual(r.json.members[1], {
    userId: ALICE,
    nickname: 'Alice',
    isOwner: false,
    roles: ['Engineers'],
  });
  assert.equal(r.json.channels[0].type, 'text');

  const other = await h.call('tailchat_get_group', {
    groupId: 'ffffffffffffffffffffffff',
  });
  assert.equal(other.isError, true);
  assert.match(other.text, /not one the bot belongs to/);
  await h.close();
});

test('tailchat_call reaches any action and tailchat_actions maps it', async () => {
  const h = await harness({
    '/group/updateGroupField': (body) => ({ updated: body }),
  });
  const r = await h.call('tailchat_call', {
    action: 'group.updateGroupField',
    params: {
      groupId: GROUP,
      fieldName: 'description',
      fieldValue: 'BAS team',
    },
  });
  assert.equal(r.isError, false, r.text);
  assert.equal(r.json.updated.fieldValue, 'BAS team');

  const map = await h.call('tailchat_actions', { filter: 'updateGroupField' });
  assert.equal(map.json.count, 1);
  assert.deepEqual(map.json.actions[0].scopes, ['group:manage']);
  assert.deepEqual(map.json.actions[0].required, [
    'groupId',
    'fieldName',
    'fieldValue',
  ]);

  const admin = await h.call('tailchat_actions', { scope: 'admin' });
  assert.ok(
    admin.json.actions.every((a: any) => a.action.startsWith('openapi.admin.'))
  );
  await h.close();
});
