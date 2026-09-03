#!/usr/bin/env node
// tailchat-mcp (stdio) — an MCP server that lets an agent act inside Tailchat as the
// user who owns the personal access token in this process's environment.
//
// Transport is stdio, so stdout belongs to the protocol. Anything diagnostic goes to
// stderr; a stray console.log corrupts the JSON-RPC stream. The hosted variant of the
// same tools is src/http.ts, which takes the token per request instead.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { ConfigError, TailchatClient, loadConfig } from './client.js';
import { INSTRUCTIONS } from './instructions.js';
import { registerTools } from './tools.js';
import { VERSION } from './version.js';

export { INSTRUCTIONS };

async function main(): Promise<void> {
  let client: TailchatClient;
  try {
    client = new TailchatClient(loadConfig());
  } catch (e) {
    if (e instanceof ConfigError) {
      process.stderr.write(`tailchat-mcp: ${e.message}\n`);
      process.exit(2);
    }
    throw e;
  }

  const server = new McpServer(
    { name: 'tailchat-mcp', version: VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS }
  );
  registerTools(server, client);

  await server.connect(new StdioServerTransport());
  process.stderr.write(
    `tailchat-mcp ${VERSION} ready — ${client.config.url}\n`
  );
}

main().catch((err) => {
  process.stderr.write(
    `tailchat-mcp: fatal ${
      err instanceof Error ? err.stack ?? err.message : String(err)
    }\n`
  );
  process.exit(1);
});
