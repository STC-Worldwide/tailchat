// Drives the hosted entrypoint over real HTTP: a fake Tailchat gateway on one socket,
// the MCP server on another, and a real MCP client speaking Streamable HTTP to it.
// What is asserted is what a remote agent actually experiences — that a token is
// required, that it is the caller's token (not the process's) that reaches the
// gateway, and that two callers never borrow each other's identity.

import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import test from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import {
  createHttpServer,
  loadHttpConfig,
  tokenFromHeaders,
  HttpConfigError,
} from '../src/http.js';

const ALICE_KEY = 'tck_' + 'a'.repeat(44);
const BOB_KEY = 'tck_' + 'b'.repeat(44);

interface Seen {
  path: string;
  auth: string | undefined;
}

/** A stand-in gateway that answers user.whoami with whoever the bearer token names. */
async function startGateway(
  seen: Seen[]
): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer((req, res) => {
    const auth = req.headers.authorization;
    seen.push({ path: req.url ?? '', auth });

    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const who =
        auth === `Bearer ${ALICE_KEY}`
          ? { id: '000000000000000000000001', nickname: 'alice' }
          : { id: '000000000000000000000002', nickname: 'bob' };
      const payload = JSON.stringify({
        code: 200,
        data: {
          user: {
            _id: who.id,
            nickname: who.nickname,
            email: `${who.nickname}@example.invalid`,
          },
          apiKey: {
            keyId: 'k'.repeat(12),
            userId: who.id,
            scopes: ['user:read'],
          },
        },
      });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(payload);
    });
  });

  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}

async function startMcp(
  upstreamUrl: string
): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createHttpServer({
    upstreamUrl,
    port: 0,
    path: '/mcp',
    timeoutMs: 5000,
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/mcp`,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}

async function connect(url: string, token: string): Promise<Client> {
  const client = new Client({ name: 'http-test', version: '0' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers: { authorization: `Bearer ${token}` } },
    })
  );
  return client;
}

test('tokenFromHeaders takes a bearer token or the X-Api-Key fallback', () => {
  assert.equal(
    tokenFromHeaders({ authorization: `Bearer ${ALICE_KEY}` }),
    ALICE_KEY
  );
  assert.equal(
    tokenFromHeaders({ authorization: `bearer ${ALICE_KEY}` }),
    ALICE_KEY
  );
  assert.equal(tokenFromHeaders({ 'x-api-key': ALICE_KEY }), ALICE_KEY);
  assert.equal(tokenFromHeaders({}), undefined);
  // A bare Authorization value is not a bearer token and must not be treated as one.
  assert.equal(tokenFromHeaders({ authorization: ALICE_KEY }), undefined);
});

test('loadHttpConfig insists on an upstream origin', () => {
  assert.throws(() => loadHttpConfig({}), HttpConfigError);
  assert.throws(
    () => loadHttpConfig({ TAILCHAT_URL: 'chat.example.com' }),
    HttpConfigError
  );
  const cfg = loadHttpConfig({ TAILCHAT_URL: 'http://service-core:3000/' });
  assert.equal(cfg.upstreamUrl, 'http://service-core:3000');
  assert.equal(cfg.path, '/mcp');
  assert.equal(cfg.port, 3010);
  assert.equal(cfg.publicUrl, undefined);
});

test('MCP_PUBLIC_URL is what agents are told, not the internal upstream', async () => {
  const cfg = loadHttpConfig({
    TAILCHAT_URL: 'http://service-core:3000',
    MCP_PUBLIC_URL: 'https://chat.example.com/',
  });
  assert.equal(cfg.publicUrl, 'https://chat.example.com');
  assert.throws(
    () =>
      loadHttpConfig({
        TAILCHAT_URL: 'http://service-core:3000',
        MCP_PUBLIC_URL: 'chat.example.com',
      }),
    HttpConfigError
  );

  const seen: Seen[] = [];
  const gw = await startGateway(seen);
  const server = createHttpServer({
    upstreamUrl: gw.url,
    publicUrl: 'https://chat.example.com',
    port: 0,
    path: '/mcp',
    timeoutMs: 5000,
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as AddressInfo;
  try {
    const client = await connect(`http://127.0.0.1:${port}/mcp`, ALICE_KEY);
    const res: any = await client.callTool({
      name: 'tailchat_whoami',
      arguments: {},
    });
    const who = JSON.parse(
      (res.content ?? []).map((c: any) => c.text ?? '').join('')
    );
    assert.equal(who.server, 'https://chat.example.com');
    // the internal hostname must not leak to the agent
    assert.ok(!JSON.stringify(who).includes('127.0.0.1'));
    await client.close();
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    await gw.close();
  }
});

test('a request with no token is refused before anything reaches the gateway', async () => {
  const seen: Seen[] = [];
  const gw = await startGateway(seen);
  const mcp = await startMcp(gw.url);
  try {
    const res = await fetch(mcp.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    assert.equal(res.status, 401);
    assert.match(res.headers.get('www-authenticate') ?? '', /Bearer/);
    const body = (await res.json()) as any;
    assert.match(body.error.message, /Settings -> API keys/);
    assert.equal(seen.length, 0, 'gateway must not be called without a token');
  } finally {
    await mcp.close();
    await gw.close();
  }
});

test('a malformed token is refused without echoing it back', async () => {
  const seen: Seen[] = [];
  const gw = await startGateway(seen);
  const mcp = await startMcp(gw.url);
  try {
    const res = await fetch(mcp.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer not-a-real-token',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    assert.equal(res.status, 401);
    const text = JSON.stringify(await res.json());
    assert.match(text, /does not look like a Tailchat personal access token/);
    assert.ok(
      !text.includes('not-a-real-token'),
      'must not echo the credential'
    );
    assert.equal(seen.length, 0);
  } finally {
    await mcp.close();
    await gw.close();
  }
});

test('GET is refused: the endpoint is stateless and has no stream to resume', async () => {
  const seen: Seen[] = [];
  const gw = await startGateway(seen);
  const mcp = await startMcp(gw.url);
  try {
    const res = await fetch(mcp.url, {
      headers: { authorization: `Bearer ${ALICE_KEY}` },
    });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'POST');
  } finally {
    await mcp.close();
    await gw.close();
  }
});

test('healthz answers without a token, and an unknown path 404s', async () => {
  const gw = await startGateway([]);
  const mcp = await startMcp(gw.url);
  const origin = new URL(mcp.url).origin;
  try {
    const health = await fetch(`${origin}/healthz`);
    assert.equal(health.status, 200);
    assert.equal(((await health.json()) as any).ok, true);

    const missing = await fetch(`${origin}/nope`, { method: 'POST' });
    assert.equal(missing.status, 404);
  } finally {
    await mcp.close();
    await gw.close();
  }
});

test('a real client lists the full tool surface over HTTP', async () => {
  const seen: Seen[] = [];
  const gw = await startGateway(seen);
  const mcp = await startMcp(gw.url);
  try {
    const client = await connect(mcp.url, ALICE_KEY);
    const { tools } = await client.listTools();
    assert.ok(
      tools.length >= 20,
      `expected the whole tool surface, got ${tools.length}`
    );
    assert.ok(tools.some((t) => t.name === 'tailchat_whoami'));
    assert.ok(tools.some((t) => t.name === 'tailchat_send_message'));
    await client.close();
  } finally {
    await mcp.close();
    await gw.close();
  }
});

test("each caller's own token reaches the gateway, never another's", async () => {
  const seen: Seen[] = [];
  const gw = await startGateway(seen);
  const mcp = await startMcp(gw.url);
  try {
    const alice = await connect(mcp.url, ALICE_KEY);
    const bob = await connect(mcp.url, BOB_KEY);

    const aliceWho = await alice.callTool({
      name: 'tailchat_whoami',
      arguments: {},
    });
    const bobWho = await bob.callTool({
      name: 'tailchat_whoami',
      arguments: {},
    });

    const textOf = (r: any) =>
      (r.content ?? []).map((c: any) => c.text ?? '').join('');
    assert.match(textOf(aliceWho), /alice/);
    assert.match(textOf(bobWho), /bob/);
    assert.ok(!textOf(aliceWho).includes('bob'));

    const auths = seen
      .filter((s) => s.path.includes('whoami'))
      .map((s) => s.auth);
    assert.ok(auths.includes(`Bearer ${ALICE_KEY}`));
    assert.ok(auths.includes(`Bearer ${BOB_KEY}`));

    await alice.close();
    await bob.close();
  } finally {
    await mcp.close();
    await gw.close();
  }
});
