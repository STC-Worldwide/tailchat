#!/usr/bin/env node
// tailchat-mcp — an MCP server that lets an agent act inside Tailchat as an OpenApp
// bot, authenticated by a scoped API key from the environment.
//
// Transport is stdio, so stdout belongs to the protocol. Anything diagnostic goes to
// stderr; a stray console.log corrupts the JSON-RPC stream.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { ConfigError, TailchatClient, loadConfig } from './client.js';
import { registerTools } from './tools.js';
import { VERSION } from './version.js';

export const INSTRUCTIONS = `You act inside a Tailchat workspace as an OpenApp bot. Start with tailchat_whoami: it
tells you who the bot is and which scopes the API key carries, and every tool says which
scope it needs. A 403 means the key lacks a scope or the bot lacks a group permission;
relay it, it cannot be widened from here.

Model of the place: a "group" is a server/workspace with channels ("panels"); a text
channel's id is also its converseId, which is what messages are posted to and read from.
Direct messages live in their own converse (tailchat_send_dm creates or reuses one). The
bot only sees groups it is a member of, so an empty tailchat_list_groups means "add the
bot to a group", not "there are no groups". Roles carry permission keys such as
core.manageUser and core.managePanel; the group owner holds all of them.

Mentions and replies are handled for you by tailchat_send_message. Ids are 24-hex
Mongo ids; show nicknames and channel names to people, not ids.

The dedicated tools cover daily work. tailchat_actions lists every other published
action and tailchat_call invokes one by name — same scopes, raw response.`;

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
