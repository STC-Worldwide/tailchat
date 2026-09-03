#!/usr/bin/env node
// tailchat-mcp (hosted) — the same tools as the stdio entrypoint, served over MCP's
// Streamable HTTP transport so an agent needs nothing installed: no repo, no build,
// no Node. A client points at the URL and sends its personal access token.
//
// Deliberately STATELESS: every request builds its own server, its own Tailchat client
// and its own transport from the token on that request, and throws all three away when
// the response ends. There is no session map, so there is nothing that could hand one
// user's identity to another — the hazard that matters most when the same process
// serves many people's tokens.
//
// The upstream origin comes from the environment (the gateway, reached over the
// internal network). Only the token is per-request.

import { realpathSync } from 'node:fs';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { TailchatClient, type TailchatConfig } from './client.js';
import { INSTRUCTIONS } from './instructions.js';
import { registerTools } from './tools.js';
import { VERSION } from './version.js';

const API_KEY_RE = /^tck_[A-Za-z0-9]{44}$/;

/** Largest JSON-RPC body accepted, to bound what an unauthenticated caller can push. */
const MAX_BODY_BYTES = 1024 * 1024;

export interface HttpConfig {
  /** Origin of the Tailchat gateway this server calls, e.g. http://service-core:3000 */
  upstreamUrl: string;
  /** Origin agents should be told they are talking to, e.g. https://chat.example.com */
  publicUrl?: string;
  port: number;
  /** Path the MCP endpoint is served at. */
  path: string;
  timeoutMs: number;
}

export class HttpConfigError extends Error {}

export function loadHttpConfig(
  env: Record<string, string | undefined> = process.env
): HttpConfig {
  const upstreamUrl = (env.TAILCHAT_URL ?? '').trim().replace(/\/+$/, '');
  if (!upstreamUrl) {
    throw new HttpConfigError(
      'TAILCHAT_URL is not set — the origin of the Tailchat gateway this server calls'
    );
  }
  if (!/^https?:\/\//.test(upstreamUrl)) {
    throw new HttpConfigError(
      `TAILCHAT_URL must start with http:// or https:// (got "${upstreamUrl}")`
    );
  }

  const port = Number(env.MCP_HTTP_PORT ?? 3010);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new HttpConfigError('MCP_HTTP_PORT must be a valid port number');
  }

  const path = (env.MCP_HTTP_PATH ?? '/mcp').trim();
  if (!path.startsWith('/')) {
    throw new HttpConfigError('MCP_HTTP_PATH must start with /');
  }

  const timeoutMs = Number(env.TAILCHAT_TIMEOUT_MS ?? 15000);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new HttpConfigError(
      'TAILCHAT_TIMEOUT_MS must be a positive number of milliseconds'
    );
  }

  const publicUrl = (env.MCP_PUBLIC_URL ?? '').trim().replace(/\/+$/, '');
  if (publicUrl && !/^https?:\/\//.test(publicUrl)) {
    throw new HttpConfigError(
      `MCP_PUBLIC_URL must start with http:// or https:// (got "${publicUrl}")`
    );
  }

  return {
    upstreamUrl,
    port,
    path,
    timeoutMs,
    ...(publicUrl ? { publicUrl } : {}),
  };
}

/**
 * Pull the personal access token off a request. `Authorization: Bearer` is what MCP
 * clients send; `X-Api-Key` mirrors what the Tailchat gateway already accepts, so a
 * client that can only set a plain header still works.
 */
export function tokenFromHeaders(
  headers: NodeJS.Dict<string | string[]>
): string | undefined {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const auth = first(headers.authorization)?.trim();
  if (auth) {
    const m = /^Bearer\s+(\S+)$/i.exec(auth);
    if (m) return m[1];
  }

  const apiKey = first(headers['x-api-key'])?.trim();
  return apiKey || undefined;
}

function send(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
    ...headers,
  });
  res.end(payload);
}

/** A JSON-RPC shaped error, so a client surfaces the reason rather than "failed". */
function rpcError(res: ServerResponse, status: number, message: string): void {
  send(
    res,
    status,
    { jsonrpc: '2.0', error: { code: -32000, message }, id: null },
    status === 401
      ? { 'www-authenticate': 'Bearer realm="tailchat", charset="UTF-8"' }
      : {}
  );
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: HttpConfig
): Promise<void> {
  const token = tokenFromHeaders(req.headers);
  if (!token) {
    rpcError(
      res,
      401,
      'No Tailchat token. Send your personal access token as `Authorization: Bearer tck_...` (create one under Settings -> API keys).'
    );
    return;
  }
  if (!API_KEY_RE.test(token)) {
    // Say what is wrong with the shape, never echo the value.
    rpcError(
      res,
      401,
      'That does not look like a Tailchat personal access token (expected tck_ followed by 44 alphanumerics).'
    );
    return;
  }

  let raw: string;
  try {
    raw = await readBody(req);
  } catch (err) {
    rpcError(res, 413, err instanceof Error ? err.message : 'unreadable body');
    return;
  }

  let parsedBody: unknown = undefined;
  if (raw) {
    try {
      parsedBody = JSON.parse(raw);
    } catch {
      rpcError(res, 400, 'request body is not valid JSON');
      return;
    }
  }

  const clientConfig: TailchatConfig = {
    url: config.upstreamUrl,
    apiKey: token,
    timeoutMs: config.timeoutMs,
    ...(config.publicUrl ? { displayUrl: config.publicUrl } : {}),
  };

  const server = new McpServer(
    { name: 'tailchat-mcp', version: VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS }
  );
  registerTools(server, new TailchatClient(clientConfig));

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });

  res.on('close', () => {
    void transport.close();
    void server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, parsedBody);
}

export function createHttpServer(config: HttpConfig) {
  return createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (url.pathname === '/healthz') {
      send(res, 200, { ok: true, name: 'tailchat-mcp', version: VERSION });
      return;
    }

    if (url.pathname !== config.path) {
      rpcError(res, 404, `no MCP endpoint at ${url.pathname}`);
      return;
    }

    // Stateless means there is no stream to resume and no session to delete, so the
    // GET and DELETE halves of the transport spec do not apply here.
    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST');
      rpcError(
        res,
        405,
        `${req.method} is not supported; this endpoint is stateless and takes POST only`
      );
      return;
    }

    handleMcpRequest(req, res, config).catch((err) => {
      process.stderr.write(
        `tailchat-mcp: request failed ${
          err instanceof Error ? err.stack ?? err.message : String(err)
        }\n`
      );
      if (!res.headersSent) {
        rpcError(res, 500, 'internal error');
      } else {
        res.end();
      }
    });
  });
}

async function main(): Promise<void> {
  let config: HttpConfig;
  try {
    config = loadHttpConfig();
  } catch (e) {
    if (e instanceof HttpConfigError) {
      process.stderr.write(`tailchat-mcp: ${e.message}\n`);
      process.exit(2);
    }
    throw e;
  }

  const server = createHttpServer(config);
  server.listen(config.port, () => {
    process.stderr.write(
      `tailchat-mcp ${VERSION} listening on :${config.port}${config.path} -> ${config.upstreamUrl}\n`
    );
  });

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => {
      server.close(() => process.exit(0));
    });
  }
}

// Only listen when this module IS the entrypoint, so tests can import the pieces
// without starting a server. realpath on both sides so a symlinked bin still matches.
function isEntrypoint(): boolean {
  const argv = process.argv[1];
  if (!argv) return false;
  try {
    return realpathSync(argv) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isEntrypoint()) {
  main().catch((err) => {
    process.stderr.write(
      `tailchat-mcp: fatal ${
        err instanceof Error ? err.stack ?? err.message : String(err)
      }\n`
    );
    process.exit(1);
  });
}
